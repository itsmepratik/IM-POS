"use client"

import { useState, useRef, useEffect } from "react"
import { useNotification } from "./notification-context"
import { Button } from "@/components/ui/button"
import { Bell, X } from "lucide-react"

export function NotificationDemo() {
  const { addNotification } = useNotification()
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Notification test functions
  const testLowStockNotification = () => {
    addNotification({
      type: "warning",
      title: "Low Stock Alert",
      message: "5 items are running low on stock. Check inventory.",
      duration: 8000
    })
  }

  const testOutOfStockNotification = () => {
    addNotification({
      type: "error",
      title: "Out of Stock Alert",
      message: "3 items are out of stock. Restock needed.",
      duration: 8000
    })
  }

  const testSuccessNotification = () => {
    addNotification({
      type: "success",
      title: "Order Fulfilled",
      message: "Order #12345 has been successfully fulfilled.",
      duration: 5000
    })
  }

  const testInfoNotification = () => {
    addNotification({
      type: "info",
      title: "New Feature",
      message: "Try our new analytics dashboard for advanced insights.",
      duration: 6000
    })
  }

  // Don't render anything during SSR to avoid hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        // Collapsed state - circular button
        <button
          className="rounded-full w-12 h-12 bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <Bell className="h-5 w-5" />
        </button>
      ) : (
        // Expanded state - notification panel
        <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg border p-3 w-64 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Test Notifications</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-amber-500 text-amber-500 hover:bg-amber-500/10"
              onClick={testLowStockNotification}
            >
              Low Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-red-500 text-red-500 hover:bg-red-500/10"
              onClick={testOutOfStockNotification}
            >
              Out of Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-green-500 text-green-500 hover:bg-green-500/10"
              onClick={testSuccessNotification}
            >
              Success
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-blue-500 text-blue-500 hover:bg-blue-500/10"
              onClick={testInfoNotification}
            >
              Info
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 