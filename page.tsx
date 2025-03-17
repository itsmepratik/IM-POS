"use client"

import { useTransfer } from "@/hooks/use-transfer"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  History,
  FileText,
  Minus,
  Plus,
  Edit2,
  X,
  Printer
} from "lucide-react"
import { PageHeader } from "@/components/page-title"

export default function TransferPage() {
  const {
    // State
    sourceLocation,
    destinationLocation,
    selectedCategory,
    transferItems,
    quantities,
    transferQuantities,
    
    // Setters
    setSourceLocation,
    setDestinationLocation,
    setSelectedCategory,
    
    // Actions
    handleQuantityChange,
    handleTransferQuantityChange,
    addToTransfer,
    removeFromTransfer,
    handlePrint,
    
    // Data
    items
  } = useTransfer();

  return (
    <Layout>
      <div className="space-y-6 w-full">
        <PageHeader
          actions={
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 print:hidden"
                title="Transfer History"
                onClick={() => window.location.href = "/restock-orders"}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5 text-xs sm:text-sm">History</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 print:hidden"
                title="Generate Receipt"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5 text-xs sm:text-sm">Receipt</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 print:hidden"
                title="Print Transfer"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5 text-xs sm:text-sm">Print</span>
              </Button>
            </div>
          }
        >
          Transfer Stock
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Left Column - Select Locations */}
          <div className="bg-white rounded-lg border p-4 md:p-6 space-y-4 md:space-y-6">
            <h2 className="text-base md:text-lg font-semibold">Select Locations</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium text-sm md:text-base">Source Location</label>
                <Select value={sourceLocation} onValueChange={setSourceLocation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select source location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="store-1">Store 1</SelectItem>
                    <SelectItem value="store-2">Store 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-sm md:text-base">Destination Location</label>
                <Select value={destinationLocation} onValueChange={setDestinationLocation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select destination location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="store-1">Store 1</SelectItem>
                    <SelectItem value="store-2">Store 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right Column - Select Items */}
          <div className="bg-white rounded-lg border p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-base md:text-lg font-semibold">Select Items</h2>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  <SelectItem value="Oils">Oils</SelectItem>
                  <SelectItem value="Filters">Filters</SelectItem>
                  <SelectItem value="Fluids">Fluids</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 md:p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 text-sm">({item.brand})</span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        SKU: {item.sku} • Location: {item.location}
                      </div>
                      <div className="text-xs md:text-sm">
                        In Stock: {item.stock} • OMR {item.price.toFixed(2)}/unit
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 md:h-8 md:w-8"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1)}
                      >
                        <Minus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <input
                        type="number"
                        className="w-10 md:w-12 h-7 md:h-8 text-center border rounded text-sm"
                        value={quantities[item.id] || 1}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        min="1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 md:h-8 md:w-8"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs md:text-sm"
                      onClick={() => addToTransfer(item)}
                      disabled={transferItems.some(i => i.id === item.id)}
                    >
                      Add to Transfer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transfer Items Section */}
        {transferItems.length > 0 && (
          <div className="bg-white rounded-lg border p-4 md:p-6 space-y-4">
            <h2 className="text-base md:text-lg font-semibold">Transfer Items</h2>
            <div className="space-y-3 md:space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {transferItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-medium text-sm md:text-base">{item.name}</div>
                      <div className="text-xs md:text-sm text-gray-600">
                        {item.brand} • {item.sku}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm whitespace-nowrap">Qty: {transferQuantities[item.id]}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 md:h-8 md:w-8"
                          onClick={() => {
                            const newQty = window.prompt("Enter new quantity:", transferQuantities[item.id]?.toString());
                            if (newQty && !isNaN(parseInt(newQty))) {
                              handleTransferQuantityChange(item.id, parseInt(newQty));
                            }
                          }}
                        >
                          <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 md:h-8 md:w-8 text-red-500 hover:text-red-600"
                        onClick={() => removeFromTransfer(item.id)}
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 md:gap-4 mt-4 md:mt-6 print:hidden">
          <Button variant="outline" size="sm" className="md:text-base md:h-10">Cancel</Button>
          <Button 
            size="sm"
            className="md:text-base md:h-10"
            disabled={transferItems.length === 0 || !sourceLocation || !destinationLocation}
          >
            Submit Transfer
          </Button>
        </div>
      </div>
    </Layout>
  )
} 