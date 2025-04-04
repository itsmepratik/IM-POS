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