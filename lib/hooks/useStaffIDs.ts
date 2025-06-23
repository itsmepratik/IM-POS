"use client";

import { useState, useEffect } from "react";

export interface StaffMember {
  id: string;
  name: string;
}

export function useStaffIDs() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    { id: "0010", name: "Abul Hossain (foreman)" },
    { id: "0020", name: "Adnan" },
    { id: "0030", name: "Ashiq" },
    { id: "0041", name: "Badsha" },
    { id: "0051", name: "Abid" },
    { id: "0062", name: "Bellal" },
    { id: "0073", name: "Sakib" },
    { id: "0084", name: "Obaydul" },
    { id: "0094", name: "Nur Alom" },
  ]);

  // Function to find a staff member by ID
  const findStaffMemberById = (id: string): StaffMember | undefined => {
    return staffMembers.find((staff) => staff.id === id);
  };

  // Function to add a new staff member
  const addStaffMember = (name: string, id: string) => {
    setStaffMembers((prev) => [...prev, { id, name }]);
  };

  // Function to update a staff member
  const updateStaffMember = (id: string, newName: string) => {
    setStaffMembers((prev) =>
      prev.map((staff) =>
        staff.id === id ? { ...staff, name: newName } : staff
      )
    );
  };

  // Function to remove a staff member
  const removeStaffMember = (id: string) => {
    setStaffMembers((prev) => prev.filter((staff) => staff.id !== id));
  };

  // Add persistence if needed
  useEffect(() => {
    // You could load from localStorage or an API here
    const savedStaff = localStorage.getItem("staffMembers");
    if (savedStaff) {
      try {
        setStaffMembers(JSON.parse(savedStaff));
      } catch (e) {
        console.error("Failed to parse saved staff members", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save to localStorage whenever the staff members change
    localStorage.setItem("staffMembers", JSON.stringify(staffMembers));
  }, [staffMembers]);

  return {
    staffMembers,
    findStaffMemberById,
    addStaffMember,
    updateStaffMember,
    removeStaffMember,
  };
}
