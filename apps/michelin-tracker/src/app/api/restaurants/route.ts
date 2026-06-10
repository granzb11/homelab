import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import { RestaurantSchema } from "@/lib/types";
import { geocodeCity } from "@/lib/geocode";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  const { searchParams } = req.nextUrl;
  const stars = searchParams.get("stars");
  const country = searchParams.get("country");
  const cuisine = searchParams.get("cuisine");
  const sort = searchParams.get("sort") ?? "dateVisited";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const allowedSort = [
    "name",
    "city",
    "country",
    "stars",
    "cuisine",
    "dateVisited",
    "rating",
    "price",
    "pairingType",
  ];

  const where: Prisma.RestaurantWhereInput = {};
  if (stars) where.stars = parseInt(stars, 10);
  if (country) where.country = { contains: country, mode: "insensitive" };
  if (cuisine) where.cuisine = { contains: cuisine, mode: "insensitive" };

  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy: allowedSort.includes(sort)
      ? { [sort]: order }
      : { dateVisited: "desc" },
  });

  return Response.json(restaurants);
}

export async function POST(req: NextRequest) {
  const prisma = getPrisma();
  const body = await req.json();
  const parsed = RestaurantSchema.parse(body);
  const coords = await geocodeCity(parsed.city, parsed.country);

  const restaurant = await prisma.restaurant.create({
    data: {
      ...parsed,
      pairingPrice: parsed.pairingPrice ?? null,
      highlightDish: parsed.highlightDish ?? null,
      notes: parsed.notes ?? null,
      photoLink: parsed.photoLink || null,
      latitude: coords?.[0] ?? null,
      longitude: coords?.[1] ?? null,
    },
  });

  return Response.json(restaurant, { status: 201 });
}
