"use server";

import { getDb, withTimeout } from "@/lib/db/client";
import { staff, type Staff } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface StaffValidationResult {
  id: string;      // UUID in staff table
  staffId: string; // Text staff_id (e.g. "0001", "0010")
  name: string;
  role: string;
  isActive: boolean;
}

/**
 * Server action to safely validate staff ID directly via Drizzle DB query
 * Works in both Server and Client contexts without next/headers cookies issues
 */
export async function validateStaffCodeAction(code: string): Promise<StaffValidationResult | null> {
  if (!code || typeof code !== "string") return null;

  try {
    const db = getDb();
    if (!db) {
      console.error("Database client not initialized during staff validation");
      return null;
    }
    const cleanCode = code.trim();
    if (!cleanCode) return null;

    // SECURITY: strict validation - never compromise, but never hang infinitely either
    const query = db
      .select({
        id: staff.id,
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        isActive: staff.isActive,
      })
      .from(staff)
      .where(and(eq(staff.staffId, cleanCode), eq(staff.isActive, true)))
      .limit(1);

    const result = await withTimeout(query as Promise<any>, 6000, `staff validation ${cleanCode}`);
    const [member] = result as any[];

    if (!member) return null;

    return {
      id: member.id,
      staffId: member.staffId,
      name: member.name,
      role: member.role,
      isActive: member.isActive ?? true,
    };
  } catch (error: any) {
    // Timeout or connection closed should return null quickly, not hang, but log for debugging
    if (error?.message?.includes("timed out")) {
      console.error("Staff validation timed out:", code, error.message);
    } else {
      console.error("Failed to validate staff code action:", error);
    }
    return null;
  }
}
