"use client";

import { useState, useEffect, useCallback } from "react";

export interface StaffMember {
  id: string; // staff_id text (like "0010") for user input compatibility
  uuid?: string; // UUID for database operations
  name: string;
  is_active?: boolean;
}

interface StaffAPIResponse {
  success: boolean;
  data: Array<{
    id: string; // UUID
    staff_id: string; // Text ID like "0010"
    name: string;
    is_active: boolean;
  }>;
  error?: string;
}

export function useStaffIDs() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch staff members from API
  const fetchStaffMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/staff");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch staff members: ${response.statusText}`
        );
      }

      const data: StaffAPIResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch staff members");
      }

      // Transform API response - use staff_id for id to maintain compatibility with existing code
      // that uses staff_id text (like "0010") for user input
      const transformedStaff: StaffMember[] = data.data.map((staff) => ({
        id: staff.staff_id, // Keep staff_id text for frontend compatibility (user input)
        uuid: staff.id, // Store UUID for API calls
        name: staff.name,
        is_active: staff.is_active,
      }));

      setStaffMembers(transformedStaff);
    } catch (err) {
      console.error("Error fetching staff members:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      // Keep empty array on error - components should handle loading/error states
      setStaffMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch staff members on mount
  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  // Function to find a staff member by ID
  const findStaffMemberById = useCallback(
    (id: string): StaffMember | undefined => {
      return staffMembers.find((staff) => staff.id === id);
    },
    [staffMembers]
  );

  // Function to add a new staff member (optimistic update)
  const addStaffMember = useCallback(
    async (name: string, id: string) => {
      try {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staff_id: id,
            name,
            is_active: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add staff member");
        }

        // Refresh staff list after successful addition
        await fetchStaffMembers();
      } catch (err) {
        console.error("Error adding staff member:", err);
        throw err;
      }
    },
    [fetchStaffMembers]
  );

  // Function to update a staff member
  const updateStaffMember = useCallback(
    async (id: string, newName: string) => {
      try {
        const response = await fetch(`/api/staff/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update staff member");
        }

        // Refresh staff list after successful update
        await fetchStaffMembers();
      } catch (err) {
        console.error("Error updating staff member:", err);
        throw err;
      }
    },
    [fetchStaffMembers]
  );

  // Function to remove a staff member (deactivate)
  const removeStaffMember = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/staff/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove staff member");
        }

        // Refresh staff list after successful deactivation
        await fetchStaffMembers();
      } catch (err) {
        console.error("Error removing staff member:", err);
        throw err;
      }
    },
    [fetchStaffMembers]
  );

  return {
    staffMembers,
    isLoading,
    error,
    findStaffMemberById,
    addStaffMember,
    updateStaffMember,
    removeStaffMember,
    refetch: fetchStaffMembers,
  };
}
