"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, ArrowLeft, ReceiptRefund, Check, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  details?: string
  uniqueId: string
}

interface Receipt {
  receiptNumber: string
  date: string
  time: string
  items: CartItem[]
  total: number
  paymentMethod: string
}

interface RefundDialogProps {
  isOpen: boolean
  onClose: () => void
}

// This would normally come from a database
// For this mock, we'll create some sample receipts
const mockReceipts: Receipt[] = [
  {
    receiptNumber: "A1234",
    date: "01/05/2023",
    time: "14:30:45",
    paymentMethod: "Card",
    total: 58.97,
    items: [
      { id: 101, name: "Toyota 0W-20", price: 39.99, quantity: 1, details: "5L", uniqueId: "101-5L" },
      { id: 301, name: "Oil Filter", price: 8.99, quantity: 1, uniqueId: "301-" },
      { id: 401, name: "Air Filter", price: 9.99, quantity: 1, uniqueId: "401-" }
    ]
  },
  {
    receiptNumber: "A2345",
    date: "02/05/2023",
    time: "10:15:22",
    paymentMethod: "Cash",
    total: 74.96,
    items: [
      { id: 102, name: "Toyota 5W-30", price: 34.99, quantity: 2, details: "4L", uniqueId: "102-4L" },
      { id: 302, name: "Cabin Filter", price: 4.98, quantity: 1, uniqueId: "302-" }
    ]
  },
  {
    receiptNumber: "A3456",
    date: "03/05/2023",
    time: "16:45:10",
    paymentMethod: "Mobile Pay",
    total: 29.97,
    items: [
      { id: 201, name: "Shell 0W-20", price: 13.99, quantity: 1, details: "1L", uniqueId: "201-1L" },
      { id: 501, name: "Wiper Blades", price: 15.98, quantity: 1, uniqueId: "501-" }
    ]
  },
];

export function RefundDialog({ isOpen, onClose }: RefundDialogProps) {
  const { toast } = useToast()
  const [receiptNumber, setReceiptNumber] = useState("")
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [refundComplete, setRefundComplete] = useState(false)
  const [step, setStep] = useState<"search" | "select" | "confirm" | "complete">("search")
  
  // Calculate refund amount
  const refundAmount = currentReceipt?.items
    .filter(item => selectedItems.includes(item.uniqueId))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
  
  // Handle looking up a receipt
  const handleLookupReceipt = () => {
    // Normally you would fetch this from an API
    const receipt = mockReceipts.find(r => r.receiptNumber.toLowerCase() === receiptNumber.toLowerCase())
    
    if (receipt) {
      setCurrentReceipt(receipt)
      setStep("select")
      setSelectedItems([])
    } else {
      toast({
        title: "Receipt not found",
        description: "Please check the receipt number and try again.",
        variant: "destructive"
      })
    }
  }
  
  // Handle toggling an item for refund
  const toggleItemSelection = (uniqueId: string) => {
    setSelectedItems(prev => 
      prev.includes(uniqueId) 
        ? prev.filter(id => id !== uniqueId) 
        : [...prev, uniqueId]
    )
  }
  
  // Handle proceeding to confirmation
  const handleProceedToConfirm = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to refund.",
        variant: "destructive"
      })
      return
    }
    
    setStep("confirm")
  }
  
  // Handle confirming the refund
  const handleConfirmRefund = () => {
    // In a real application, you would make an API call here
    setIsConfirmDialogOpen(false)
    setStep("complete")
    setRefundComplete(true)
  }
  
  // Handle closing the dialog
  const handleCloseDialog = () => {
    if (step === "complete") {
      // Reset everything
      setReceiptNumber("")
      setCurrentReceipt(null)
      setSelectedItems([])
      setRefundComplete(false)
      setStep("search")
      onClose()
    } else if (step === "search") {
      // Just close the dialog
      onClose()
    } else {
      // Go back to search
      setReceiptNumber("")
      setCurrentReceipt(null)
      setSelectedItems([])
      setStep("search")
    }
  }
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90%] max-w-[600px] h-[90vh] md:h-auto max-h-[90vh] md:max-h-[85vh] rounded-lg overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl flex items-center gap-2">
              {step !== "search" && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 mr-1" 
                  onClick={() => setStep("search")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {step === "search" && "Process Refund"}
              {step === "select" && "Select Items to Refund"}
              {step === "confirm" && "Confirm Refund"}
              {step === "complete" && "Refund Complete"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(90vh-8rem)] md:max-h-[calc(85vh-8rem)]">
              <div className="px-6 pb-6 space-y-4">
                <AnimatePresence mode="wait">
                  {step === "search" && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="text-sm text-muted-foreground">
                        Enter the receipt number to process a refund. You can find this on the customer's receipt.
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Receipt Number (e.g., A1234)"
                            className="pl-10"
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && receiptNumber) {
                                handleLookupReceipt()
                              }
                            }}
                          />
                        </div>
                        <Button 
                          onClick={handleLookupReceipt}
                          disabled={!receiptNumber}
                        >
                          Search
                        </Button>
                      </div>
                      
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Sample Receipt Numbers
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {mockReceipts.map(receipt => (
                            <div key={receipt.receiptNumber} className="flex justify-between">
                              <span>{receipt.receiptNumber}</span>
                              <span>OMR {receipt.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {step === "select" && currentReceipt && (
                    <motion.div
                      key="select"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg border p-4 mb-4">
                        <div className="text-sm font-medium mb-2">Receipt Information</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Receipt #:</span> {currentReceipt.receiptNumber}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span> {currentReceipt.date}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span> {currentReceipt.time}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment:</span> {currentReceipt.paymentMethod}
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Total:</span> OMR {currentReceipt.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm font-medium mb-2">Select Items to Refund</div>
                      
                      <div className="space-y-2">
                        {currentReceipt.items.map((item) => (
                          <Card key={item.uniqueId} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div 
                                className={cn(
                                  "p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                  selectedItems.includes(item.uniqueId) && "bg-muted"
                                )}
                                onClick={() => toggleItemSelection(item.uniqueId)}
                              >
                                <Checkbox 
                                  checked={selectedItems.includes(item.uniqueId)}
                                  onCheckedChange={() => toggleItemSelection(item.uniqueId)}
                                  className="h-5 w-5"
                                />
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="font-medium">{item.name}</div>
                                      {item.details && (
                                        <div className="text-xs text-muted-foreground">{item.details}</div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">OMR {(item.price * item.quantity).toFixed(2)}</div>
                                      {item.quantity > 1 && (
                                        <div className="text-xs text-muted-foreground">
                                          {item.quantity} × OMR {item.price.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {selectedItems.length > 0 && (
                        <div className="rounded-lg border p-4 bg-muted/50 mt-4">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Total Refund Amount</span>
                            <span>OMR {refundAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  {step === "confirm" && currentReceipt && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg border p-4 mb-4">
                        <div className="text-sm font-medium mb-2">Refund Summary</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Receipt #:</span> {currentReceipt.receiptNumber}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span> {currentReceipt.date}
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Items to Refund:</span> {selectedItems.length}
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Refund Amount:</span> OMR {refundAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm font-medium mb-2">Items to Refund</div>
                      
                      <div className="space-y-2">
                        {currentReceipt.items
                          .filter(item => selectedItems.includes(item.uniqueId))
                          .map((item) => (
                            <Card key={item.uniqueId} className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-medium">{item.name}</div>
                                    {item.details && (
                                      <div className="text-xs text-muted-foreground">{item.details}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">OMR {(item.price * item.quantity).toFixed(2)}</div>
                                    {item.quantity > 1 && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.quantity} × OMR {item.price.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                      
                      <div className="rounded-lg border p-4 bg-muted/50 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <div className="text-sm font-medium">Refund Policy</div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Refunds are issued to the original payment method.</p>
                          <p>For cash purchases, store credit may be issued if appropriate.</p>
                          <p>All refunds are subject to manager approval.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {step === "complete" && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="rounded-full bg-green-100 p-4 mb-6"
                      >
                        <Check className="w-8 h-8 text-green-600" />
                      </motion.div>
                      
                      <h3 className="text-xl font-semibold mb-2">Refund Complete</h3>
                      
                      <p className="text-center text-muted-foreground mb-6">
                        The refund of <span className="font-semibold">OMR {refundAmount.toFixed(2)}</span> has been processed successfully.
                      </p>
                      
                      {currentReceipt && (
                        <div className="w-full max-w-sm rounded-lg border p-4 mb-4">
                          <div className="text-sm font-medium mb-2">Refund Details</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Receipt #:</span> {currentReceipt.receiptNumber}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span> {new Date().toLocaleDateString('en-GB')}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time:</span> {new Date().toLocaleTimeString('en-GB')}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Items:</span> {selectedItems.length}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Refund Amount:</span> OMR {refundAmount.toFixed(2)}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Refund Method:</span> {currentReceipt.paymentMethod}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t">
            {step === "search" && (
              <Button variant="outline" onClick={handleCloseDialog}>Close</Button>
            )}
            
            {step === "select" && (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button 
                  onClick={handleProceedToConfirm}
                  disabled={selectedItems.length === 0}
                >
                  Continue
                </Button>
              </>
            )}
            
            {step === "confirm" && (
              <>
                <Button variant="outline" onClick={() => setStep("select")}>Back</Button>
                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Process Refund
                </Button>
              </>
            )}
            
            {step === "complete" && (
              <Button onClick={handleCloseDialog}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Refund Alert Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to process this refund for OMR {refundAmount.toFixed(2)}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRefund}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 