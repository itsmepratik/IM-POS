"use client"

import { useState, useEffect } from "react"
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
    setIsExpanded(false)
  }

  const testOutOfStockNotification = () => {
    addNotification({
      type: "error",
      title: "Out of Stock Alert",
      message: "3 items are out of stock. Restock needed.",
      duration: 8000
    })
    setIsExpanded(false)
  }

  const testSuccessNotification = () => {
    addNotification({
      type: "success",
      title: "Order Fulfilled",
      message: "Order #12345 has been successfully fulfilled.",
      duration: 5000
    })
    setIsExpanded(false)
  }

  const testInfoNotification = () => {
    addNotification({
      type: "info",
      title: "New Feature",
      message: "Try our new analytics dashboard for advanced insights.",
      duration: 6000
    })
    setIsExpanded(false)
  }

  // Show a simple button during SSR to avoid hydration issues
  if (!mounted) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="rounded-full w-12 h-12 bg-blue-500 text-white shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        // Collapsed state - circular button
        <button
          className="rounded-full w-12 h-12 bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
          onClick={() => setIsExpanded(true)}
          aria-label="Open notification test panel"
        >
          <Bell className="h-5 w-5" />
        </button>
      ) : (
        // Expanded state - notification panel
        <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg border p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Test Notifications</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => setIsExpanded(false)}
              aria-label="Close notification panel"
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