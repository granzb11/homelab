import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import { RestaurantSchema } from "@/lib/types";
import { geocodeCity } from "@/lib/geocode";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const prisma = getPrisma();
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!restaurant) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(restaurant);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const prisma = getPrisma();
  const { id } = await params;
  const numId = parseInt(id, 10);
  const body = await req.json();
  const parsed = RestaurantSchema.parse(body);

  const existing = await prisma.restaurant.findUnique({ where: { id: numId } });
  let latitude = existing?.latitude ?? null;
  let longitude = existing?.longitude ?? null;
  if (
    !existing ||
    existing.city !== parsed.city ||
    existing.country !== parsed.country
  ) {
    const coords = await geocodeCity(parsed.city, parsed.country);
    latitude = coords?.[0] ?? null;
    longitude = coords?.[1] ?? null;
  }

  const restaurant = await prisma.restaurant.update({
    where: { id: numId },
    data: {
      ...parsed,
      pairingPrice: parsed.pairingPrice ?? null,
      highlightDish: parsed.highlightDish ?? null,
      notes: parsed.notes ?? null,
      photoLink: parsed.photoLink || null,
      latitude,
      longitude,
    },
  });
  return Response.json(restaurant);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const prisma = getPrisma();
  const { id } = await params;
  await prisma.restaurant.delete({ where: { id: parseInt(id, 10) } });
  return new Response(null, { status: 204 });
}
