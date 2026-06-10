"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { RestaurantSchema } from "@/lib/types";
import { geocodeCity } from "@/lib/geocode";

export async function createRestaurant(data: unknown) {
  const prisma = getPrisma();
  const parsed = RestaurantSchema.parse(data);
  const coords = await geocodeCity(parsed.city, parsed.country);
  const restaurant = await prisma.restaurant.create({
    data: {
      ...parsed,
      foodCost: parsed.foodCost ?? null,
      pairingPrice: parsed.pairingPrice ?? null,
      highlightDish: parsed.highlightDish ?? null,
      notes: parsed.notes ?? null,
      photoLink: parsed.photoLink || null,
      latitude: coords?.[0] ?? null,
      longitude: coords?.[1] ?? null,
    },
  });
  revalidatePath("/restaurants");
  revalidatePath("/dashboard");
  revalidatePath("/map");
  return restaurant;
}

export async function updateRestaurant(id: number, data: unknown) {
  const prisma = getPrisma();
  const parsed = RestaurantSchema.parse(data);
  const existing = await prisma.restaurant.findUnique({ where: { id } });
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
    where: { id },
    data: {
      ...parsed,
      foodCost: parsed.foodCost ?? null,
      pairingPrice: parsed.pairingPrice ?? null,
      highlightDish: parsed.highlightDish ?? null,
      notes: parsed.notes ?? null,
      photoLink: parsed.photoLink || null,
      latitude,
      longitude,
    },
  });
  revalidatePath("/restaurants");
  revalidatePath("/dashboard");
  revalidatePath("/map");
  return restaurant;
}

export async function deleteRestaurant(id: number) {
  const prisma = getPrisma();
  await prisma.restaurant.delete({ where: { id } });
  revalidatePath("/restaurants");
  revalidatePath("/dashboard");
  revalidatePath("/map");
}
