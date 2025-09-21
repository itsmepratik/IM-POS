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
  console.log("🏗️ useCustomers: Hook initializing");
  
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  console.log("🎛️ useCustomers: Current state", {
    customersCount: customers.length,
    loading,
    error: error?.substring(0, 100) // Truncate long errors
  });

  // Transform database customer to CustomerData format
  const transformCustomer = useCallback((dbCustomer: any, vehicles: any[] = []): CustomerData => {
    console.log("🔄 useCustomers: Transforming customer", {
      customerId: dbCustomer.id,
      customerName: dbCustomer.name,
      vehiclesCount: vehicles.length
    });
    
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
    
    console.log("✅ useCustomers: Customer transformed", {
      customerId: transformed.id,
      hasEmail: !!transformed.email,
      hasPhone: !!transformed.phone,
      vehiclesCount: transformed.vehicles.length
    });
    
    return transformed;
  }, []);

  // Fetch customers from database
  const fetchCustomers = useCallback(async (isMounted?: boolean) => {
    console.log("📡 useCustomers: Starting fetchCustomers");
    
    try {
      if (isMounted !== false) {
        setLoading(true);
        setError(null);
        
        console.log("🔄 useCustomers: Setting loading to true, clearing error");
      }

      // Fetch customers with their vehicles
      console.log("🔍 useCustomers: Executing Supabase query for customers");
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

      console.log("📊 useCustomers: Supabase query result", {
        hasData: !!customersData,
        dataLength: customersData?.length || 0,
        hasError: !!customersError,
        errorMessage: customersError?.message
      });

      if (customersError) {
        console.error("❌ useCustomers: Supabase query error", customersError);
        throw customersError;
      }

      console.log("🔄 useCustomers: Starting customer transformation");
      const transformedCustomers = customersData?.map(customer => 
        transformCustomer(customer, customer.customer_vehicles || [])
      ) || [];

      // Only update state if component is still mounted
      if (isMounted !== false) {
        console.log("✅ useCustomers: Customers transformed, updating state", {
          transformedCount: transformedCustomers.length
        });
        setCustomers(transformedCustomers);
      }
      
      console.log("🎯 useCustomers: fetchCustomers completed successfully");
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
        console.log("🏁 useCustomers: Setting loading to false");
        setLoading(false);
      }
    }
  }, [supabase, transformCustomer]);

  // Add new customer
  const addCustomer = useCallback(async (customerData: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerData | null> => {
    console.log("➕ useCustomers: Starting addCustomer", {
      customerName: customerData.name,
      hasEmail: !!customerData.email,
      hasPhone: !!customerData.phone,
      vehiclesCount: customerData.vehicles?.length || 0
    });
    
    try {
      setError(null);
      console.log("🔄 useCustomers: Clearing error state for addCustomer");

      // Insert customer
      console.log("💾 useCustomers: Inserting customer into database");
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

      console.log("📊 useCustomers: Customer insert result", {
        hasNewCustomer: !!newCustomer,
        newCustomerId: newCustomer?.id,
        hasError: !!customerError
      });

      if (customerError) {
        console.error("❌ useCustomers: Customer insert error", customerError);
        throw customerError;
      }

      // Insert vehicles if any
      let vehiclesData: any[] = [];
      if (customerData.vehicles && customerData.vehicles.length > 0) {
        console.log("🚗 useCustomers: Inserting vehicles", {
          vehicleCount: customerData.vehicles.length,
          customerId: newCustomer.id
        });
        
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

        console.log("📊 useCustomers: Vehicles insert result", {
          hasNewVehicles: !!newVehicles,
          newVehiclesCount: newVehicles?.length || 0,
          hasError: !!vehiclesError
        });

        if (vehiclesError) {
          console.error("❌ useCustomers: Vehicles insert error", vehiclesError);
          throw vehiclesError;
        }
        vehiclesData = newVehicles || [];
      }

      console.log("🔄 useCustomers: Transforming new customer");
      const transformedCustomer = transformCustomer(newCustomer, vehiclesData);
      
      console.log("📝 useCustomers: Updating customers state with new customer");
      setCustomers(prev => {
        console.log("🔄 useCustomers: Previous customers count", prev.length);
        const newState = [transformedCustomer, ...prev];
        console.log("🔄 useCustomers: New customers count", newState.length);
        return newState;
      });

      toast({
        title: "Success",
        description: "Customer added successfully",
      });

      console.log("✅ useCustomers: addCustomer completed successfully", {
        customerId: transformedCustomer.id
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
    console.log("✏️ useCustomers: Starting updateCustomer", {
      customerId: id,
      updateKeys: Object.keys(updates),
      hasVehicleUpdates: updates.vehicles !== undefined
    });
    
    try {
      setError(null);
      console.log("🔄 useCustomers: Clearing error state for updateCustomer");

      // Update customer basic info
      const customerUpdates: any = {};
      if (updates.name !== undefined) customerUpdates.name = updates.name;
      if (updates.email !== undefined) customerUpdates.email = updates.email || null;
      if (updates.phone !== undefined) customerUpdates.phone = updates.phone || null;
      if (updates.notes !== undefined) customerUpdates.notes = updates.notes || null;
      if (updates.lastVisit !== undefined) customerUpdates.last_visit = updates.lastVisit || null;
      if (updates.address !== undefined) customerUpdates.address = updates.address || null;

      console.log("💾 useCustomers: Updating customer in database", {
        customerId: id,
        updateFields: Object.keys(customerUpdates)
      });

      const { data: updatedCustomer, error: customerError } = await supabase
        .from('customers')
        .update(customerUpdates)
        .eq('id', id)
        .select()
        .single();

      console.log("📊 useCustomers: Customer update result", {
        hasUpdatedCustomer: !!updatedCustomer,
        hasError: !!customerError
      });

      if (customerError) {
        console.error("❌ useCustomers: Customer update error", customerError);
        throw customerError;
      }

      // Handle vehicle updates if provided
      let vehiclesData: any[] = [];
      if (updates.vehicles !== undefined) {
        console.log("🚗 useCustomers: Updating vehicles", {
          customerId: id,
          newVehicleCount: updates.vehicles.length
        });
        
        // Delete existing vehicles
        console.log("🗑️ useCustomers: Deleting existing vehicles");
        await supabase
          .from('customer_vehicles')
          .delete()
          .eq('customer_id', id);

        // Insert new vehicles
        if (updates.vehicles.length > 0) {
          console.log("➕ useCustomers: Inserting new vehicles");
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

          console.log("📊 useCustomers: New vehicles insert result", {
            hasNewVehicles: !!newVehicles,
            newVehiclesCount: newVehicles?.length || 0,
            hasError: !!vehiclesError
          });

          if (vehiclesError) {
            console.error("❌ useCustomers: New vehicles insert error", vehiclesError);
            throw vehiclesError;
          }
          vehiclesData = newVehicles || [];
        }
      } else {
        // Fetch existing vehicles if not updating them
        console.log("🔍 useCustomers: Fetching existing vehicles");
        const { data: existingVehicles } = await supabase
          .from('customer_vehicles')
          .select('*')
          .eq('customer_id', id);
        vehiclesData = existingVehicles || [];
        console.log("📊 useCustomers: Existing vehicles fetched", {
          vehicleCount: vehiclesData.length
        });
      }

      console.log("🔄 useCustomers: Transforming updated customer");
      const transformedCustomer = transformCustomer(updatedCustomer, vehiclesData);
      
      console.log("📝 useCustomers: Updating customers state with updated customer");
      setCustomers(prev => {
        const newState = prev.map(customer => 
          customer.id === id ? transformedCustomer : customer
        );
        console.log("🔄 useCustomers: Customer updated in state");
        return newState;
      });

      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      console.log("✅ useCustomers: updateCustomer completed successfully", {
        customerId: transformedCustomer.id
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
    console.log("🗑️ useCustomers: Starting deleteCustomer", { customerId: id });
    
    try {
      setError(null);
      console.log("🔄 useCustomers: Clearing error state for deleteCustomer");

      // Delete customer (vehicles will be deleted automatically due to cascade)
      console.log("💾 useCustomers: Deleting customer from database");
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      console.log("📊 useCustomers: Customer delete result", {
        hasError: !!deleteError,
        customerId: id
      });

      if (deleteError) {
        console.error("❌ useCustomers: Customer delete error", deleteError);
        throw deleteError;
      }

      console.log("📝 useCustomers: Removing customer from state");
      setCustomers(prev => {
        const newState = prev.filter(customer => customer.id !== id);
        console.log("🔄 useCustomers: Customer removed from state", {
          previousCount: prev.length,
          newCount: newState.length
        });
        return newState;
      });

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });

      console.log("✅ useCustomers: deleteCustomer completed successfully", {
        customerId: id
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
    console.log("🔍 useCustomers: Getting customer by ID", { customerId: id });
    const customer = customers.find(customer => customer.id === id);
    console.log("📊 useCustomers: Customer found", {
      customerId: id,
      found: !!customer,
      customerName: customer?.name
    });
    return customer;
  }, [customers]);

  // Refresh customers
  const refreshCustomers = useCallback(async () => {
    console.log("🔄 useCustomers: Starting refreshCustomers");
    await fetchCustomers();
    console.log("✅ useCustomers: refreshCustomers completed");
  }, [fetchCustomers]);

  // Initial fetch
  useEffect(() => {
    console.log("🚀 useCustomers: useEffect triggered for initial fetch");
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchCustomers();
      }
    };
    
    fetchData();
    
    // Cleanup function to prevent memory leaks and race conditions
    return () => {
      console.log("🧹 useCustomers: Cleaning up useEffect");
      isMounted = false;
    };
  }, [fetchCustomers]);

  console.log("🎯 useCustomers: Returning hook values", {
    customersCount: customers.length,
    loading,
    hasError: !!error
  });

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