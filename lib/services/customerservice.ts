import { toast } from '@/components/ui/use-toast';

export interface Vehicle {
  id?: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
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
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  vehicles: Vehicle[];
}

class CustomerService {
  private baseUrl = '/api/customers';

  async createCustomer(customerData: CreateCustomerData): Promise<CustomerData | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      return result.customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer",
        variant: "destructive",
      });
      return null;
    }
  }

  async getCustomerById(id: string): Promise<CustomerData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch customer');
      }

      const result = await response.json();
      return result.customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch customer",
        variant: "destructive",
      });
      return null;
    }
  }

  async updateLastVisit(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastVisit: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update customer');
      }

      return true;
    } catch (error) {
      console.error('Error updating customer last visit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update customer",
        variant: "destructive",
      });
      return false;
    }
  }

  async getAllCustomers(): Promise<CustomerData[]> {
    try {
      const response = await fetch(this.baseUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch customers');
      }

      const result = await response.json();
      return result.customers || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch customers",
        variant: "destructive",
      });
      return [];
    }
  }

  async updateCustomer(id: string, updates: Partial<CustomerData>): Promise<CustomerData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update customer');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      return result.customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update customer",
        variant: "destructive",
      });
      return null;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
      return false;
    }
  }
}

export const customerService = new CustomerService();