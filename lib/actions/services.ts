"use server";

import { getDatabase } from "@/lib/db/client";
import { services, type Service, type NewService } from "@/lib/db/schema";
import { eq, sql, asc, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache-tags";

export async function getServices(category?: string): Promise<Service[]> {
  const db = getDatabase();
  const conditions = [eq(services.isActive, true)];
  if (category) {
    conditions.push(eq(services.category, category));
  }
  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
  const result = await db
    .select()
    .from(services)
    .where(whereClause)
    .orderBy(asc(services.name));
  return result;
}

export async function getAllServices(): Promise<Service[]> {
  const db = getDatabase();
  return db.select().from(services).orderBy(asc(services.name));
}

export async function getService(id: string): Promise<Service | undefined> {
  const db = getDatabase();
  const result = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  return result[0];
}

export async function createService(data: NewService): Promise<Service> {
  const db = getDatabase();
  const result = await db.insert(services).values(data).returning();
  revalidateTag(CACHE_TAGS.SERVICES);
  return result[0];
}

export async function updateService(
  id: string,
  data: Partial<NewService>,
): Promise<Service> {
  const db = getDatabase();
  const result = await db
    .update(services)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();
  revalidateTag(CACHE_TAGS.SERVICES);
  return result[0];
}

export async function deleteService(id: string): Promise<void> {
  const db = getDatabase();
  await db
    .update(services)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(services.id, id));
  revalidateTag(CACHE_TAGS.SERVICES);
}

export async function searchServices(query: string): Promise<Service[]> {
  const db = getDatabase();
  const result = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.isActive, true),
        sql`lower(${services.name}) LIKE lower(${`%${query}%`})`,
      ),
    )
    .orderBy(asc(services.name))
    .limit(20);
  return result;
}
