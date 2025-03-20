"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { CustomerData, Vehicle } from "./customer-form"

// Sample data for initial customers
const initialCustomers: CustomerData[] = [
  { 
    id: 1, 
    name: "John Smith", 
    email: "john.smith@example.com", 
    phone: "(555) 123-4567", 
    vehicles: [
      { 
        id: "v1", 
        make: "Toyota", 
        model: "Camry", 
        year: "2020", 
        licensePlate: "ABC-1234" 
      },
      { 
        id: "v2", 
        make: "Honda", 
        model: "Civic", 
        year: "2018", 
        licensePlate: "XYZ-9876" 
      }
    ], 
    lastVisit: "2023-05-15",
    address: "123 Main St, Anytown, CA 12345",
    notes: "Prefers appointments on weekends."
  },
  { 
    id: 2, 
    name: "Sarah Johnson", 
    email: "sarah.j@example.com", 
    phone: "(555) 234-5678", 
    vehicles: [
      { 
        id: "v3", 
        make: "Ford", 
        model: "Explorer", 
        year: "2021", 
        licensePlate: "DEF-4567" 
      }
    ], 
    lastVisit: "2023-06-02" 
  },
  { 
    id: 3, 
    name: "Michael Brown", 
    email: "mbrown@example.com", 
    phone: "(555) 345-6789", 
    vehicles: [
      { 
        id: "v4", 
        make: "Chevrolet", 
        model: "Malibu", 
        year: "2019", 
        licensePlate: "GHI-7890" 
      },
      { 
        id: "v5", 
        make: "Nissan", 
        model: "Altima", 
        year: "2020", 
        licensePlate: "JKL-0123" 
      },
      { 
        id: "v6", 
        make: "Tesla", 
        model: "Model 3", 
        year: "2022", 
        licensePlate: "MNO-3456" 
      }
    ], 
    lastVisit: "2023-05-28",
    notes: "VIP customer."
  },
  { 
    id: 4, 
    name: "Emily Davis", 
    email: "emily.davis@example.com", 
    phone: "(555) 456-7890", 
    vehicles: [
      { 
        id: "v7", 
        make: "BMW", 
        model: "X5", 
        year: "2021", 
        licensePlate: "PQR-6789" 
      }
    ], 
    lastVisit: "2023-06-10" 
  },
  { 
    id: 5, 
    name: "Robert Wilson", 
    email: "rwilson@example.com", 
    phone: "(555) 567-8901", 
    vehicles: [
      { 
        id: "v8", 
        make: "Audi", 
        model: "A4", 
        year: "2019", 
        licensePlate: "STU-9012" 
      },
      { 
        id: "v9", 
        make: "Lexus", 
        model: "RX", 
        year: "2020", 
        licensePlate: "VWX-3456" 
      }
    ], 
    lastVisit: "2023-05-20",
    address: "789 Oak Dr, Other City, NY 54321"
  },
  { 
    id: 6, 
    name: "Jennifer Lee", 
    email: "jlee@example.com", 
    phone: "(555) 678-9012", 
    vehicles: [
      { 
        id: "v10", 
        make: "Hyundai", 
        model: "Sonata", 
        year: "2022", 
        licensePlate: "YZA-6789" 
      }
    ], 
    lastVisit: "2023-06-05" 
  }
]

interface CustomersContextType {
  customers: CustomerData[]
  addCustomer: (customer: Omit<CustomerData, "id" | "lastVisit">) => void
  updateCustomer: (id: number, customer: Omit<CustomerData, "id" | "lastVisit">) => void
  deleteCustomer: (id: number) => void
  getCustomerById: (id: number) => CustomerData | undefined
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined)

export function useCustomers() {
  const context = useContext(CustomersContext)
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider')
  }
  return context
}

interface CustomersProviderProps {
  children: ReactNode
}

export function CustomersProvider({ children }: CustomersProviderProps) {
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers)

  // Simulate loading from localStorage or API
  useEffect(() => {
    const storedCustomers = localStorage.getItem('customers')
    if (storedCustomers) {
      setCustomers(JSON.parse(storedCustomers))
    }
  }, [])

  // Save to localStorage when customers change
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers))
  }, [customers])

  const addCustomer = (customer: Omit<CustomerData, "id" | "lastVisit">) => {
    const newCustomer: CustomerData = {
      ...customer,
      id: Math.max(0, ...customers.map(c => c.id)) + 1,
      lastVisit: new Date().toISOString().split('T')[0]
    }
    
    setCustomers(prevCustomers => [...prevCustomers, newCustomer])
  }

  const updateCustomer = (id: number, customerData: Omit<CustomerData, "id" | "lastVisit">) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => 
        customer.id === id 
          ? { ...customer, ...customerData } 
          : customer
      )
    )
  }

  const deleteCustomer = (id: number) => {
    setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== id))
  }

  const getCustomerById = (id: number) => {
    return customers.find(customer => customer.id === id)
  }

  const value = {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById
  }

  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  )
} 