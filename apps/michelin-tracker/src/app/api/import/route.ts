import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import { parseExcelBuffer } from "@/lib/excel";
import { geocodeBatch } from "@/lib/geocode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const prisma = getPrisma();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  let rows;
  try {
    rows = parseExcelBuffer(buffer);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Parse failed" },
      { status: 422 }
    );
  }

  const coordMap = await geocodeBatch(
    rows.map((r) => ({ city: r.city, country: r.country }))
  );

  const data = rows.map((r) => {
    const key = `${r.city.toLowerCase()},${r.country.toLowerCase()}`;
    const coords = coordMap.get(key);
    return {
      ...r,
      latitude: coords?.[0] ?? null,
      longitude: coords?.[1] ?? null,
    };
  });

  const result = await prisma.restaurant.createMany({
    data,
    skipDuplicates: true,
  });

  return Response.json({ imported: result.count, total: rows.length });
}
