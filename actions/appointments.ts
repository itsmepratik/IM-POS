"use server";

import { getDatabase } from "@/lib/db/client";
import { appointments } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AppointmentFilters = {
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
};

export async function getAppointments(filters?: AppointmentFilters) {
  try {
    const db = getDatabase();
    
    let query = db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.appointmentDate));

    // Apply filters if needed
    // Note: complex filtering with dynamic clauses can be added here
    // For now, fetching all and filtering in memory or simple status filters can work for small datasets
    // But let's try to add where clause if meaningful
    
    // For simplicity with this current setup and potential types
    const allAppointments = await query;
    
    let filtered = allAppointments;

    if (filters?.status && filters.status !== "all") {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    return { success: true, data: filtered };
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return { success: false, error: "Failed to fetch appointments" };
  }
}

export async function updateAppointmentStatus(id: string, status: string) {
  try {
    const db = getDatabase();
    
    await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id));

    revalidatePath("/appointments");
    return { success: true };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return { success: false, error: "Failed to update appointment status" };
  }
}

export async function createAppointment(data: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: string;
  appointmentDate: Date;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  notes?: string;
}) {
  try {
    const db = getDatabase();
    
    await db.insert(appointments).values({
      ...data,
      status: "pending",
    });

    revalidatePath("/appointments");
    return { success: true };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { success: false, error: "Failed to create appointment" };
  }
}
