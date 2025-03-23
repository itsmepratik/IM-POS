"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { XIcon, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { useBranch } from "./branch-context"

// Custom hook to check inventory status without using the full dashboard data
function useInventoryStatus() {
  const [lowStockItems, setLowStockItems] = useState(0)
  const [outOfStockItems, setOutOfStockItems] = useState(0)
  const { currentBranch } = useBranch()

  useEffect(() => {
    // This would be replaced with a real API call in production
    const checkInventoryStatus = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // For demo purposes, we'll generate random inventory alerts
        // In production, this would fetch real data from your backend
        const randomLowStock = Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0
        const randomOutOfStock = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0
        
        setLowStockItems(randomLowStock)
        setOutOfStockItems(randomOutOfStock)
      } catch (error) {
        console.error("Error checking inventory status:", error)
      }
    }

    checkInventoryStatus()
    
    // Check every 5 minutes
    const interval = setInterval(checkInventoryStatus, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [currentBranch])

  return { lowStockItems, outOfStockItems }
}

type NotificationType = "success" | "error" | "warning" | "info"

interface Notification {
  id: string
  type: NotificationType
  message: string
  title?: string
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id">) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { lowStockItems, outOfStockItems } = useInventoryStatus()

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = notification.duration || 5000

    setNotifications((prev) => {
      // Check if a notification with similar content already exists
      const hasExisting = prev.some(
        (item) => item.title === notification.title && item.message === notification.message
      )
      
      if (hasExisting) {
        return prev
      }
      
      return [...prev, { ...notification, id }]
    })

    // Auto remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Check for low stock items and show notifications
  useEffect(() => {
    if (lowStockItems > 0) {
      addNotification({
        type: "warning",
        title: "Low Stock Alert",
        message: `${lowStockItems} items are running low on stock. Check inventory.`,
        duration: 8000
      })
    }

    if (outOfStockItems > 0) {
      addNotification({
        type: "error",
        title: "Out of Stock Alert",
        message: `${outOfStockItems} items are out of stock. Restock needed.`,
        duration: 8000
      })
    }
  }, [lowStockItems, outOfStockItems, addNotification])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  return (
    <div className="fixed top-4 z-50 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4 flex flex-col items-center space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <NotificationItem notification={notification} onClose={removeNotification} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onClose: (id: string) => void
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { id, type, title, message } = notification

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20"
      case "error":
        return "bg-red-50 dark:bg-red-900/20"
      case "warning":
        return "bg-amber-50 dark:bg-amber-900/20"
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20"
      default:
        return "bg-blue-50 dark:bg-blue-900/20"
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-green-500"
      case "error":
        return "border-red-500"
      case "warning":
        return "border-amber-500"
      case "info":
        return "border-blue-500"
      default:
        return "border-blue-500"
    }
  }

  return (
    <div 
      className={`rounded-lg shadow-lg backdrop-blur-sm border-l-4 ${getBgColor()} ${getBorderColor()} p-4 flex items-start w-full`}
      style={{ 
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)"
      }}
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-medium text-sm truncate">{title}</h3>
        )}
        <p className="text-sm text-muted-foreground mt-1 break-words">{message}</p>
      </div>
      <button 
        onClick={() => onClose(id)} 
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label="Close notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  )
} 