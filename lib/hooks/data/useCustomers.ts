"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Types matching the existing customer structure
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color?: string;
  engineType?: string;
  notes?: string;
}

export interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  vehicles: Vehicle[];
  notes?: string;
  lastVisit?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface UseCustomersReturn {
  customers: CustomerData[];
  loading: boolean;
  error: string | null;
  addCustomer: (customer: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomerData | null>;
  updateCustomer: (id: string, updates: Partial<CustomerData>) => Promise<CustomerData | null>;
  deleteCustomer: (id: string) => Promise<boolean>;
  getCustomerById: (id: string) => CustomerData | undefined;
  refreshCustomers: () => Promise<void>;
}

export function useCustomers(): UseCustomersReturn {
  
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Transform database customer to CustomerData format
  const transformCustomer = useCallback((dbCustomer: any, vehicles: any[] = []): CustomerData => {
    
    const transformed = {
      id: dbCustomer.id,
      name: dbCustomer.name,
      email: dbCustomer.email || undefined,
      phone: dbCustomer.phone || undefined,
      notes: dbCustomer.notes || undefined,
      lastVisit: dbCustomer.last_visit || undefined,
      address: dbCustomer.address ? {
        street: dbCustomer.address, // Using text field as street for now
        city: undefined,
        state: undefined,
        zipCode: undefined,
        country: undefined,
      } : undefined,
      vehicles: vehicles.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        year: parseInt(v.year) || 0,
        plateNumber: v.license_plate,
        color: undefined, // Not available in current schema
        engineType: v.vin || undefined, // Using VIN field for engine type temporarily
        notes: v.notes || undefined,
      })),
      createdAt: dbCustomer.created_at,
      updatedAt: dbCustomer.updated_at,
    };
    
    return transformed;
  }, []);

  // Fetch customers from database
  const fetchCustomers = useCallback(async (isMounted?: boolean) => {
    
    try {
      if (isMounted !== false) {
        setLoading(true);
        setError(null);
      }

      // Fetch customers with their vehicles
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          customer_vehicles (
            id,
            make,
            model,
            year,
            license_plate,
            vin,
            notes
          )
        `)
        .order('created_at', { ascending: false });

      if (customersError) {
        console.error("❌ useCustomers: Supabase query error", customersError);
        throw customersError;
      }
      const transformedCustomers = customersData?.map(customer => 
        transformCustomer(customer, customer.customer_vehicles || [])
      ) || [];

      // Only update state if component is still mounted
      if (isMounted !== false) {
        setCustomers(transformedCustomers);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      console.error("💥 useCustomers: fetchCustomers error", {
        error: err,
        errorMessage,
        errorType: typeof err
      });
      
      // Only update error state if component is still mounted
      if (isMounted !== false) {
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      console.error('Error fetching customers:', err);
    } finally {
      // Only update loading state if component is still mounted
      if (isMounted !== false) {
        setLoading(false);
      }
    }
  }, [supabase, transformCustomer]);

  // Add new customer
  const addCustomer = useCallback(async (customerData: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerData | null> => {
    
    try {
      setError(null);

      // Insert customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
          notes: customerData.notes || null,
          last_visit: customerData.lastVisit || null,
          address: customerData.address || null,
        })
        .select()
        .single();

      if (customerError) {
        console.error("❌ useCustomers: Customer insert error", customerError);
        throw customerError;
      }

      // Insert vehicles if any
      let vehiclesData: any[] = [];
      if (customerData.vehicles && customerData.vehicles.length > 0) {
        
        const { data: newVehicles, error: vehiclesError } = await supabase
          .from('customer_vehicles')
          .insert(
            customerData.vehicles.map(vehicle => ({
              customer_id: newCustomer.id,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year.toString(),
              license_plate: vehicle.plateNumber,
              vin: vehicle.engineType || null,
              notes: vehicle.notes || null,
            }))
          )
          .select();

        if (vehiclesError) {
          console.error("❌ useCustomers: Vehicles insert error", vehiclesError);
          throw vehiclesError;
        }
        vehiclesData = newVehicles || [];
      }
      const transformedCustomer = transformCustomer(newCustomer, vehiclesData);
      setCustomers(prev => {
        const newState = [transformedCustomer, ...prev];
        return newState;
      });

      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      return transformedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add customer';
      console.error("💥 useCustomers: addCustomer error", {
        error: err,
        errorMessage
      });
      setError(errorMessage);
      console.error('Error adding customer:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [supabase, transformCustomer]);

  // Update customer
  const updateCustomer = useCallback(async (id: string, updates: Partial<CustomerData>): Promise<CustomerData | null> => {
    
    try {
      setError(null);

      // Update customer basic info
      const customerUpdates: any = {};
      if (updates.name !== undefined) customerUpdates.name = updates.name;
      if (updates.email !== undefined) customerUpdates.email = updates.email || null;
      if (updates.phone !== undefined) customerUpdates.phone = updates.phone || null;
      if (updates.notes !== undefined) customerUpdates.notes = updates.notes || null;
      if (updates.lastVisit !== undefined) customerUpdates.last_visit = updates.lastVisit || null;
      if (updates.address !== undefined) customerUpdates.address = updates.address || null;

      const { data: updatedCustomer, error: customerError } = await supabase
        .from('customers')
        .update(customerUpdates)
        .eq('id', id)
        .select()
        .single();

      if (customerError) {
        console.error("❌ useCustomers: Customer update error", customerError);
        throw customerError;
      }

      // Handle vehicle updates if provided
      let vehiclesData: any[] = [];
      if (updates.vehicles !== undefined) {
        
        // Delete existing vehicles
        await supabase
          .from('customer_vehicles')
          .delete()
          .eq('customer_id', id);

        // Insert new vehicles
        if (updates.vehicles.length > 0) {
          const { data: newVehicles, error: vehiclesError } = await supabase
            .from('customer_vehicles')
            .insert(
              updates.vehicles.map(vehicle => ({
                customer_id: id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year.toString(),
                license_plate: vehicle.plateNumber,
                vin: vehicle.engineType || null,
                notes: vehicle.notes || null,
              }))
            )
            .select();

          if (vehiclesError) {
            console.error("❌ useCustomers: New vehicles insert error", vehiclesError);
            throw vehiclesError;
          }
          vehiclesData = newVehicles || [];
        }
      } else {
        // Fetch existing vehicles if not updating them
        const { data: existingVehicles } = await supabase
          .from('customer_vehicles')
          .select('*')
          .eq('customer_id', id);
        vehiclesData = existingVehicles || [];
      }
      const transformedCustomer = transformCustomer(updatedCustomer, vehiclesData);
      setCustomers(prev => {
        const newState = prev.map(customer => 
          customer.id === id ? transformedCustomer : customer
        );
        return newState;
      });

      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      return transformedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      console.error("💥 useCustomers: updateCustomer error", {
        error: err,
        errorMessage,
        customerId: id
      });
      setError(errorMessage);
      console.error('Error updating customer:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [supabase, transformCustomer]);

  // Delete customer
  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    
    try {
      setError(null);

      // Delete customer (vehicles will be deleted automatically due to cascade)
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error("❌ useCustomers: Customer delete error", deleteError);
        throw deleteError;
      }
      setCustomers(prev => {
        const newState = prev.filter(customer => customer.id !== id);
        return newState;
      });

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      console.error("💥 useCustomers: deleteCustomer error", {
        error: err,
        errorMessage,
        customerId: id
      });
      setError(errorMessage);
      console.error('Error deleting customer:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [supabase]);

  // Get customer by ID
  const getCustomerById = useCallback((id: string): CustomerData | undefined => {
    const customer = customers.find(customer => customer.id === id);
    return customer;
  }, [customers]);

  // Refresh customers
  const refreshCustomers = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchCustomers();
      }
    };
    
    fetchData();
    
    // Cleanup function to prevent memory leaks and race conditions
    return () => {
      isMounted = false;
    };
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    refreshCustomers,
  };
}