import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a travel booking parser. Given raw email text, extract structured booking information and return ONLY valid JSON — no markdown, no explanation.

Determine if this is a "booking" (flight, hotel, Airbnb, train, bus, car rental) or an "excursion" (food tour, city tour, museum, restaurant reservation, activity, experience).

For a BOOKING return:
{
  "kind": "booking",
  "type": "FLIGHT" | "HOTEL" | "AIRBNB" | "TRAIN" | "BUS" | "RENTAL_CAR" | "OTHER",
  "title": "concise title e.g. 'AA 456 NYC → LAX' or 'Hilton Tokyo'",
  "provider": "airline/hotel/service name",
  "confirmationCode": "booking/confirmation/reservation number",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "startLocation": "departure city/airport code or null",
  "endLocation": "arrival city/airport code or null",
  "price": "numeric string or null",
  "currency": "3-letter currency code, default USD",
  "notes": "any other useful info or null"
}

Use BREAKFAST, LUNCH, or DINNER when the reservation is clearly for that specific meal (e.g. the email mentions a meal time or the reservation time falls in that window); use RESTAURANT as a fallback when the meal isn't specified.

For an EXCURSION return:
{
  "kind": "excursion",
  "type": "FOOD_TOUR" | "CITY_TOUR" | "MUSEUM" | "RESTAURANT" | "BREAKFAST" | "LUNCH" | "DINNER" | "ACTIVITY" | "OTHER",
  "title": "concise title",
  "location": "venue/address or null",
  "date": "YYYY-MM-DD or null",
  "startTime": "HH:MM (24h) or null",
  "durationMinutes": number or null,
  "price": "numeric string or null",
  "currency": "3-letter currency code, default USD",
  "confirmationCode": "booking/confirmation number or null",
  "notes": "any other useful info or null"
}

If you cannot confidently parse the email as a booking or excursion, return:
{ "kind": "unknown", "error": "brief reason" }`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { emailText, imageData, mimeType } = body;

  if (!emailText?.trim() && !imageData) {
    return NextResponse.json({ error: "emailText or imageData required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const userContent: Anthropic.MessageParam["content"] = imageData
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: (mimeType ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: imageData,
          },
        },
        { type: "text", text: "Parse this booking confirmation screenshot or photo." },
      ]
    : `Parse this booking confirmation email:\n\n${emailText.slice(0, 8000)}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse response", raw: text },
      { status: 422 }
    );
  }
}
