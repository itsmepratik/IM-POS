"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  History, 
  FileText, 
  Truck, 
  Pencil, 
  X, 
  ChevronDown 
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useTransfer, InventoryItem } from "@/hooks/use-transfer"
import { useTransferLocations } from "@/lib/hooks/data/useTransferLocations"

// Define interfaces for our data
interface Location {
  id: string
  name: string
}

interface TransferItem {
  id: string
  name: string
  category: string
  brand: string
  sku: string
  quantity: number
  price: number
}

// Define a proper interface for the converted item
interface ConvertedInventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  location: string;
  inStock: number;
  price: number;
}

export default function TransferPage() {
  const { toast } = useToast()
  const { items, refreshItems } = useTransfer() // Get items from the hook
  const { locations, categories, isLoading: locationsLoading } = useTransferLocations()
  const [hasMounted, setHasMounted] = useState(false)
  
  // Use useEffect to refresh items when the component mounts
  useEffect(() => {
    refreshItems();
  }, []);
  
  const [sourceLocation, setSourceLocation] = useState<string>("")
  const [destinationLocation, setDestinationLocation] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transferSuccess, setTransferSuccess] = useState(false)
  const [currentDate, setCurrentDate] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [transferId, setTransferId] = useState<string>("")

  // Use useEffect to set the date, time, and transfer ID only on the client side
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-GB'))
    setCurrentTime(new Date().toLocaleTimeString('en-GB'))
    setTransferId(`TO-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`)
  }, [])

  useEffect(() => {
    // Set hasMounted to true after component mounts
    setHasMounted(true)
  }, [])

  // Convert hook items to the format expected by this component
  const inventoryItems = items.map(item => ({
    id: item.id.toString(),
    name: item.name,
    category: item.brand, // Using brand as category for now
    brand: item.brand,
    sku: item.sku,
    location: item.location,
    inStock: item.stock,
    price: item.price
  }))

  // Filter items based on search query and category
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = 
      selectedCategory === "All Categories" || 
      item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Handle quantity change
  const handleQuantityChange = (itemId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + value)
    }))
  }

  // Add item to transfer
  const addToTransfer = (item: ConvertedInventoryItem) => {
    const quantity = quantities[item.id] || 1
    
    // Check if item already exists in transfer
    const existingItemIndex = transferItems.findIndex(i => i.id === item.id)
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...transferItems]
      updatedItems[existingItemIndex].quantity += quantity
      setTransferItems(updatedItems)
    } else {
      // Add new item to transfer
      setTransferItems(prev => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          brand: item.brand,
          sku: item.sku,
          quantity: quantity,
          price: item.price
        }
      ])
    }
    
    // Reset quantity for this item
    setQuantities(prev => ({
      ...prev,
      [item.id]: 1
    }))
    
    // Show success toast
    toast({
      title: "Item Added",
      description: `${quantity} ${item.name} added to transfer`,
    })
  }

  // Remove item from transfer
  const removeFromTransfer = (itemId: string) => {
    setTransferItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Edit item quantity in transfer
  const editTransferItem = (itemId: string, newQuantity: number) => {
    setTransferItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    )
  }

  // Submit transfer
  const submitTransfer = () => {
    if (!sourceLocation || !destinationLocation) {
      toast({
        title: "Error",
        description: "Please select both source and destination locations",
        variant: "destructive"
      })
      return
    }
    
    if (transferItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to transfer",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setTransferSuccess(true)
      
      // Reset form after success
      setTimeout(() => {
        setTransferSuccess(false)
        setTransferItems([])
        setSourceLocation("")
        setDestinationLocation("")
        
        toast({
          title: "Transfer Submitted",
          description: "Your transfer order has been submitted successfully",
        })
      }, 2000)
    }, 1500)
  }

  // Cancel transfer
  const cancelTransfer = () => {
    setTransferItems([])
    setCancelDialogOpen(false)
    
    toast({
      title: "Transfer Cancelled",
      description: "Your transfer has been cancelled",
    })
  }

  // Generate receipt
  const generateReceipt = () => {
    if (transferItems.length === 0) {
      toast({
        title: "Error",
        description: "No items to generate receipt for",
        variant: "destructive"
      })
      return
    }
    
    // In a real app, this would generate a PDF or open a print dialog
    window.print()
    
    toast({
      title: "Receipt Generated",
      description: "Transfer receipt has been generated",
    })
  }

  // Check if locations are the same
  const isSameLocation = sourceLocation === destinationLocation && sourceLocation !== ""

  return (
    <Layout>
      <div className="space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/inventory">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Transfer Stock</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => window.location.href = "/restock-orders"}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Transfer History</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={generateReceipt}
              disabled={transferItems.length === 0}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Receipt</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                refreshItems();
                toast({
                  title: "Items Refreshed",
                  description: "The item list has been refreshed with the latest data",
                });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              <span className="hidden sm:inline">Refresh Items</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Location Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Location</label>
                {hasMounted ? (
                  <Select value={sourceLocation} onValueChange={setSourceLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem 
                          key={location.id} 
                          value={location.id}
                          disabled={location.id === destinationLocation}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 border rounded-md" /> /* Placeholder to maintain layout */
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination Location</label>
                {hasMounted ? (
                  <Select value={destinationLocation} onValueChange={setDestinationLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem 
                          key={location.id} 
                          value={location.id}
                          disabled={location.id === sourceLocation}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 border rounded-md" /> /* Placeholder to maintain layout */
                )}
              </div>
              
              {isSameLocation && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm">
                  Source and destination cannot be the same location.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Item Selection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Select Items</CardTitle>
              {hasMounted ? (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-[180px] h-10 border rounded-md" /> /* Placeholder to maintain layout */
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Search items by name, SKU, or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-6">
                  {filteredItems.map(item => (
                    <div key={item.id} className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">({item.brand})</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p>SKU: {item.sku} • Location: {item.location}</p>
                          <p className="flex items-center gap-1">
                            In Stock: <span className="font-medium">{item.inStock}</span> •
                            <span className="font-medium">OMR {item.price.toFixed(2)}/unit</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">
                            {quantities[item.id] || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => addToTransfer(item)}
                          disabled={isSameLocation}
                        >
                          Add to Transfer
                        </Button>
                      </div>
                      
                      <Separator />
                    </div>
                  ))}
                  
                  {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No items found matching your criteria.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Items</CardTitle>
          </CardHeader>
          <CardContent>
            {transferItems.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="divide-y">
                    {transferItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4">
                        <div className="space-y-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.brand} • {item.sku}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Qty: {item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const newQty = prompt("Enter new quantity:", item.quantity.toString())
                                if (newQty && !isNaN(parseInt(newQty)) && parseInt(newQty) > 0) {
                                  editTransferItem(item.id, parseInt(newQty))
                                }
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => removeFromTransfer(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={transferItems.length === 0 || isSameLocation || !sourceLocation || !destinationLocation}
                    className="gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Submit Transfer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items added to transfer yet. Select items from above to add them to your transfer.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Print-only receipt view */}
      <div className="hidden print:block p-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-2">H Automotives</h1>
          <h2 className="text-xl font-semibold text-center mb-6">Transfer Order</h2>
          
          <div className="mb-6">
            <p><strong>Date:</strong> {currentDate}</p>
            <p><strong>Time:</strong> {currentTime}</p>
            <p><strong>From:</strong> {locations.find(l => l.id === sourceLocation)?.name || 'N/A'}</p>
            <p><strong>To:</strong> {locations.find(l => l.id === destinationLocation)?.name || 'N/A'}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Items:</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {transferItems.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.sku}</div>
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-center text-sm mt-8 pt-4 border-t">
            <p>Transfer ID: {transferId}</p>
            <p>Printed on: {currentDate} {currentTime}</p>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this transfer? This will update inventory levels at both locations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={submitTransfer}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : transferSuccess ? (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Success!</span>
                </div>
              ) : (
                "Submit Transfer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this transfer? All selected items will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep items</AlertDialogCancel>
            <AlertDialogAction 
              onClick={cancelTransfer}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, cancel transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
} 