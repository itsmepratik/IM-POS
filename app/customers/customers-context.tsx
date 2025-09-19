"use client";

import React, { createContext, useContext } from "react";
import { useCustomers as useCustomersHook } from "@/lib/hooks/data/useCustomers";
import type { CustomerData, Vehicle } from "@/lib/hooks/data/useCustomers";

// Re-export types for backward compatibility
export type { CustomerData, Vehicle };

interface CustomersContextType {
  customers: CustomerData[];
  loading: boolean;
  error: string | null;
  addCustomer: (customer: Omit<CustomerData, "id" | "createdAt" | "updatedAt">) => Promise<CustomerData | null>;
  updateCustomer: (id: string, updates: Partial<CustomerData>) => Promise<CustomerData | null>;
  deleteCustomer: (id: string) => Promise<boolean>;
  getCustomerById: (id: string) => CustomerData | undefined;
  refreshCustomers: () => Promise<void>;
}

const CustomersContext = createContext<CustomersContextType | undefined>(
  undefined
);

export const useCustomers = () => {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error("useCustomers must be used within a CustomersProvider");
  }
  return context;
};

export const CustomersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the database hook instead of mock data
  const customersHook = useCustomersHook();

  const value: CustomersContextType = {
    customers: customersHook.customers,
    loading: customersHook.loading,
    error: customersHook.error,
    addCustomer: customersHook.addCustomer,
    updateCustomer: customersHook.updateCustomer,
    deleteCustomer: customersHook.deleteCustomer,
    getCustomerById: customersHook.getCustomerById,
    refreshCustomers: customersHook.refreshCustomers,
  };

  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  );
};