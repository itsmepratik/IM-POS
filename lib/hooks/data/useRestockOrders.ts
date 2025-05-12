import { useState, useCallback, useEffect } from "react"

export interface TransferItem {
  id: string
  name: string
  quantity: number
  unit: string
}

export interface TransferOrder {
  id: string
  orderNumber: string
  date: string
  time: string
  sourceLocation: string
  destinationLocation: string
  itemCount: number
  status: "pending" | "confirmed" | "rejected"
  items: TransferItem[]
}

export function useRestockOrders() {
  const [transfers, setTransfers] = useState<TransferOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch restock orders
  const fetchRestockOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from localStorage
      const savedTransfers = localStorage.getItem("restockOrders")
      
      if (savedTransfers) {
        setTransfers(JSON.parse(savedTransfers))
        setIsLoading(false)
        return
      }
      
      // If no localStorage data, simulate a fetch from future DB
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Mock items data
      const mockItems: Record<string, TransferItem[]> = {
        "to-001": [
          { id: "item-001", name: "Toyota Oil Filter", quantity: 5, unit: "pcs" },
          { id: "item-002", name: "Brake Fluid DOT 4", quantity: 10, unit: "bottles" }
        ],
        "to-002": [
          { id: "item-003", name: "Wiper Blades 22\"", quantity: 8, unit: "pairs" },
          { id: "item-004", name: "Engine Oil 5W-30", quantity: 12, unit: "liters" }
        ],
        "to-003": [
          { id: "item-005", name: "Air Filter", quantity: 15, unit: "pcs" }
        ],
        "to-004": [
          { id: "item-006", name: "Transmission Fluid", quantity: 6, unit: "bottles" },
          { id: "item-007", name: "Coolant", quantity: 8, unit: "bottles" }
        ],
        // New large order with 15+ items
        "to-005": [
          { id: "item-008", name: "Synthetic Oil 5W-40", quantity: 20, unit: "liters" },
          { id: "item-009", name: "Spark Plugs NGK Iridium", quantity: 32, unit: "pcs" },
          { id: "item-010", name: "Air Filter Toyota Camry", quantity: 15, unit: "pcs" },
          { id: "item-011", name: "Cabin Filter Honda Accord", quantity: 10, unit: "pcs" },
          { id: "item-012", name: "Brake Pads Front Set", quantity: 8, unit: "sets" },
          { id: "item-013", name: "Brake Discs Front Pair", quantity: 6, unit: "pairs" },
          { id: "item-014", name: "Windshield Washer Fluid", quantity: 24, unit: "bottles" },
          { id: "item-015", name: "Power Steering Fluid", quantity: 12, unit: "bottles" },
          { id: "item-016", name: "Differential Fluid 75W-90", quantity: 8, unit: "liters" },
          { id: "item-017", name: "Transmission Fluid ATF", quantity: 16, unit: "liters" },
          { id: "item-018", name: "Oil Filter Nissan Altima", quantity: 18, unit: "pcs" },
          { id: "item-019", name: "Radiator Cap 1.1 Bar", quantity: 10, unit: "pcs" },
          { id: "item-020", name: "Thermostat Toyota Corolla", quantity: 7, unit: "pcs" },
          { id: "item-021", name: "Serpentine Belt Honda Civic", quantity: 9, unit: "pcs" },
          { id: "item-022", name: "Water Pump Ford Focus", quantity: 5, unit: "pcs" },
          { id: "item-023", name: "Fuel Filter Hyundai Sonata", quantity: 12, unit: "pcs" },
          { id: "item-024", name: "Shock Absorber KYB Front", quantity: 6, unit: "pcs" }
        ]
      }

      // Initial transfer orders data
      const initialData: TransferOrder[] = [
        {
          id: "to-001",
          orderNumber: "TO-2023-001",
          date: "Nov 15, 2023",
          time: "10:30 AM",
          sourceLocation: "Main Warehouse",
          destinationLocation: "Downtown Shop",
          itemCount: 2,
          status: "pending",
          items: mockItems["to-001"]
        },
        {
          id: "to-002",
          orderNumber: "TO-2023-002",
          date: "Nov 16, 2023",
          time: "02:15 PM",
          sourceLocation: "Main Warehouse",
          destinationLocation: "Westside Location",
          itemCount: 2,
          status: "pending",
          items: mockItems["to-002"]
        },
        {
          id: "to-003",
          orderNumber: "TO-2023-003",
          date: "Nov 14, 2023",
          time: "09:00 AM",
          sourceLocation: "South Distribution Center",
          destinationLocation: "Downtown Shop",
          itemCount: 1,
          status: "confirmed",
          items: mockItems["to-003"]
        },
        {
          id: "to-004",
          orderNumber: "TO-2023-004",
          date: "Nov 13, 2023",
          time: "11:45 AM",
          sourceLocation: "East Warehouse",
          destinationLocation: "Northside Branch",
          itemCount: 2,
          status: "rejected",
          items: mockItems["to-004"]
        },
        // New large transfer order
        {
          id: "to-005",
          orderNumber: "TO-2023-005",
          date: "Nov 18, 2023",
          time: "09:45 AM",
          sourceLocation: "Central Distribution Hub",
          destinationLocation: "Main Service Center",
          itemCount: 17,
          status: "pending",
          items: mockItems["to-005"]
        }
      ]
      
      setTransfers(initialData)
      
      // Save to localStorage
      localStorage.setItem("restockOrders", JSON.stringify(initialData))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to update a transfer order status
  const updateTransferStatus = useCallback(async (
    transferId: string, 
    newStatus: "pending" | "confirmed" | "rejected"
  ) => {
    try {
      const updatedTransfers = transfers.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, status: newStatus }
          : transfer
      )
      
      setTransfers(updatedTransfers)
      localStorage.setItem("restockOrders", JSON.stringify(updatedTransfers))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update transfer status'))
      return false
    }
  }, [transfers])

  // Fetch data on mount
  useEffect(() => {
    fetchRestockOrders()
  }, [fetchRestockOrders])

  return {
    transfers,
    isLoading,
    error,
    updateTransferStatus,
    refreshTransfers: fetchRestockOrders
  }
} 