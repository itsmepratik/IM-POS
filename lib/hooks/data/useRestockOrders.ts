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
          { id: "item-004", name: "Engine Oil 5W-30", quantity: 12, unit: "liters" },
          { id: "item-101", name: "BMW Oil Filter OEM 11427566327", quantity: 25, unit: "pcs" },
          { id: "item-102", name: "Mercedes Brake Pads Front A0084200220", quantity: 12, unit: "sets" },
          { id: "item-103", name: "Audi Air Filter 8K0133843K", quantity: 18, unit: "pcs" },
          { id: "item-104", name: "Volkswagen DSG Transmission Fluid G052182A2", quantity: 30, unit: "liters" },
          { id: "item-105", name: "Range Rover Cabin Filter LR073255", quantity: 10, unit: "pcs" },
          { id: "item-106", name: "Lexus Spark Plugs Laser Iridium 90919-01247", quantity: 48, unit: "pcs" },
          { id: "item-107", name: "Honda Timing Belt Kit 14400-RNA-A01", quantity: 8, unit: "kits" },
          { id: "item-108", name: "Toyota Water Pump 16100-39466", quantity: 12, unit: "pcs" },
          { id: "item-109", name: "Nissan CVT Fluid NS-3 KLE53-00004", quantity: 36, unit: "liters" },
          { id: "item-110", name: "Subaru Valve Cover Gasket 13270AA140", quantity: 15, unit: "pcs" },
          { id: "item-111", name: "Ford EcoBoost Turbo 2.0L CM5G-6K682-CB", quantity: 4, unit: "pcs" },
          { id: "item-112", name: "Mazda Throttle Body L3R413640", quantity: 7, unit: "pcs" },
          { id: "item-113", name: "Volvo Oxygen Sensor 31405616", quantity: 14, unit: "pcs" },
          { id: "item-114", name: "Hyundai Fuel Pump 31110-3K500", quantity: 8, unit: "pcs" },
          { id: "item-115", name: "Kia EGR Valve 284104A470", quantity: 9, unit: "pcs" },
          { id: "item-116", name: "Porsche PDK Fluid 000-043-305-15", quantity: 16, unit: "liters" },
          { id: "item-117", name: "Jaguar Supercharger Pulley C2C39532", quantity: 5, unit: "pcs" },
          { id: "item-118", name: "Chevrolet Camshaft Position Sensor 12585546", quantity: 12, unit: "pcs" },
          { id: "item-119", name: "Jeep Wrangler Shock Absorber Set 68289266AA", quantity: 8, unit: "sets" },
          { id: "item-120", name: "Land Rover Brake Rotor LR059124", quantity: 12, unit: "pcs" },
          { id: "item-121", name: "Mitsubishi Turbocharger 1515A295", quantity: 3, unit: "pcs" },
          { id: "item-122", name: "Acura TSX Alternator 31100-RK2-004", quantity: 6, unit: "pcs" },
          { id: "item-123", name: "Infiniti Serpentine Belt 11720-3JA0A", quantity: 15, unit: "pcs" },
          { id: "item-124", name: "Aston Martin Brake Caliper 4G43-2B120-AD", quantity: 4, unit: "pcs" },
          { id: "item-125", name: "Tesla Model 3 HEPA Air Filter 1067702-00-A", quantity: 20, unit: "pcs" },
          { id: "item-126", name: "Cadillac ATS Power Steering Pump 23348451", quantity: 7, unit: "pcs" },
          { id: "item-127", name: "Dodge Charger Control Arm 68058114AE", quantity: 8, unit: "pcs" },
          { id: "item-128", name: "Ferrari 458 Ignition Coil 241517", quantity: 12, unit: "pcs" },
          { id: "item-129", name: "Maserati Ghibli Fuel Injector 317290", quantity: 6, unit: "pcs" },
          { id: "item-130", name: "Bentley Continental Wheel Bearing 3W0598625A", quantity: 8, unit: "pcs" },
          { id: "item-131", name: "Lamborghini Huracan Air Filter 4S0129620C", quantity: 5, unit: "pcs" },
          { id: "item-132", name: "Rolls Royce Ghost Wiper Blades RR05-WB", quantity: 6, unit: "pairs" },
          { id: "item-133", name: "Bugatti Chiron Oil Filter 04E115561H", quantity: 3, unit: "pcs" },
          { id: "item-134", name: "McLaren 720S Brake Pad Sensor 11M33-CP", quantity: 8, unit: "pcs" },
          { id: "item-135", name: "Genesis G70 Drive Belt Tensioner 25281-2C300", quantity: 10, unit: "pcs" },
          { id: "item-136", name: "Alfa Romeo Giulia Radiator Fan 50537291", quantity: 5, unit: "pcs" },
          { id: "item-137", name: "MINI Cooper S Turbocharger Gasket Kit 11657593942", quantity: 9, unit: "kits" },
          { id: "item-138", name: "Fiat 500 Clutch Kit 55248101", quantity: 7, unit: "kits" },
          { id: "item-139", name: "RAM 1500 Fuel Pump Module 68470275AA", quantity: 6, unit: "pcs" },
          { id: "item-140", name: "GMC Sierra Transfer Case Motor 19125571", quantity: 4, unit: "pcs" },
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
          itemCount: 42,
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