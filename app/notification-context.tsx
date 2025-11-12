"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { XIcon, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { usePathname } from "next/navigation"
import { useBranch } from "./branch-context"
import { createClient } from "@/supabase/client"
import {
  createNotification,
  getNotifications,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  CreateNotificationParams,
  NotificationRecord,
} from "@/lib/services/notificationService"

// Custom hook to check inventory status without using the full dashboard data
function useInventoryStatus() {
  const [lowStockItems, setLowStockItems] = useState(0)
  const [outOfStockItems, setOutOfStockItems] = useState(0)
  const { currentBranch } = useBranch()

  // We've disabled automatic inventory checks to prevent auto-loading notifications
  // If you want to re-enable this feature, uncomment the useEffect below
  /*
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
  */

  return { lowStockItems, outOfStockItems }
}

type NotificationType = "success" | "error" | "warning" | "info"

interface Notification {
  id: string
  type: NotificationType
  message: string
  title?: string
  duration?: number
  timestamp: number
  isPersisted?: boolean // Whether this notification is saved in the database
  dbId?: string // Database ID if persisted
  isTemporary?: boolean // Whether this is a temporary hover notification that should auto-dismiss
  is_read?: boolean // Whether this notification has been read
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  addPersistentNotification: (params: CreateNotificationParams) => Promise<void>
  removeNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  loadNotifications: (includeRead?: boolean) => Promise<void>
  unreadCount: number
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { lowStockItems, outOfStockItems } = useInventoryStatus()
  const supabase = createClient()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const realtimeChannelRef = useRef<any>(null)
  
  // Update pathname ref whenever pathname changes
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Convert database notification to UI notification
  const dbNotificationToUI = useCallback((dbNotif: NotificationRecord): Notification => {
    return {
      id: `db-${dbNotif.id}`,
      type: dbNotif.type,
      title: dbNotif.title,
      message: dbNotif.message,
      timestamp: new Date(dbNotif.created_at).getTime(),
      isPersisted: true,
      dbId: dbNotif.id,
      is_read: dbNotif.is_read,
    }
  }, [])

  // Load notifications from database (only for notifications page)
  const loadNotifications = useCallback(async (includeRead: boolean = false) => {
    try {
      setIsLoading(true)
      // Load unread notifications to update unread count
      const unreadNotifications = await getNotifications({ is_read: false, limit: 50 })
      
      // Update unread count
      setUnreadCount(unreadNotifications.length)
      
      // If includeRead is true (notifications page), load all notifications
      if (includeRead) {
        const readNotifications = await getNotifications({ is_read: true, limit: 50 })
        const allNotifications = [...unreadNotifications, ...readNotifications]
        
        // Convert to UI format
        const dbUI = allNotifications.map(dbNotificationToUI)
        
        // On notifications page: replace all notifications with DB ones (keep temporary ones that are still active)
        setNotifications((prev) => {
          const activeTemporaryNotifications = prev.filter(n => n.isTemporary)
          return [...activeTemporaryNotifications, ...dbUI]
        })
      } else {
        // For hover context: DON'T load DB notifications, only update unread count
        // Hover should only show temporary notifications
        // Keep existing temporary notifications
        setNotifications((prev) => prev.filter(n => n.isTemporary))
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [dbNotificationToUI])

  // Set up realtime subscription for notifications
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          return
        }

        // Create a channel for notifications
        const channel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log('[Realtime] Notification change:', payload.eventType, payload)
              
              if (payload.eventType === 'INSERT') {
                const newNotification = payload.new as NotificationRecord
                const uiNotification = dbNotificationToUI(newNotification)
                
                // Update unread count
                const count = await getUnreadCount()
                setUnreadCount(count)
                
                // Always add notification to state if on notifications page
                setNotifications((prev) => {
                  // Check if notification already exists (avoid duplicates)
                  const exists = prev.some(n => n.dbId === newNotification.id)
                  if (exists) {
                    console.log('[Realtime] Notification already exists, skipping:', newNotification.id)
                    return prev
                  }
                  
                  // Check if we're on notifications page using ref
                  const isOnNotificationsPage = pathnameRef.current === "/notifications"
                  console.log('[Realtime] INSERT - isOnNotificationsPage:', isOnNotificationsPage, 'pathname:', pathnameRef.current)
                  
                  // If on notifications page, add to list (at the top, before other DB notifications)
                  if (isOnNotificationsPage) {
                    const activeTemporaryNotifications = prev.filter(n => n.isTemporary)
                    const existingDbNotifications = prev.filter(n => !n.isTemporary)
                    const newState = [uiNotification, ...activeTemporaryNotifications, ...existingDbNotifications]
                    console.log('[Realtime] Adding notification to state, new count:', newState.length)
                    return newState
                  }
                  
                  // Otherwise, keep temporary notifications only (badge will update via unreadCount)
                  console.log('[Realtime] Not on notifications page, keeping temporary only')
                  return prev.filter(n => n.isTemporary)
                })
              } else if (payload.eventType === 'UPDATE') {
                const updatedNotification = payload.new as NotificationRecord
                const uiNotification = dbNotificationToUI(updatedNotification)
                
                // Update unread count
                const count = await getUnreadCount()
                setUnreadCount(count)
                
                // Update notification in state
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.dbId === updatedNotification.id ? uiNotification : n
                  )
                )
              } else if (payload.eventType === 'DELETE') {
                const deletedId = payload.old.id
                
                // Update unread count
                const count = await getUnreadCount()
                setUnreadCount(count)
                
                // Remove notification from state
                setNotifications((prev) =>
                  prev.filter((n) => n.dbId !== deletedId)
                )
              }
            }
          )
          .subscribe()

        realtimeChannelRef.current = channel

        return () => {
          if (channel) {
            supabase.removeChannel(channel)
          }
        }
      } catch (error) {
        console.error('Error setting up realtime subscription:', error)
      }
    }

    setupRealtimeSubscription()
  }, [supabase, dbNotificationToUI])

  // Update unread count periodically (for badge display) - reduced frequency since we have realtime
  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const count = await getUnreadCount()
        setUnreadCount(count)
      } catch (error) {
        console.error("Error updating unread count:", error)
      }
    }
    
    // Update immediately
    updateUnreadCount()
    
    // Update every 60 seconds as a fallback (realtime handles most updates)
    const interval = setInterval(updateUnreadCount, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Remove notification helper (defined first to avoid circular dependency)
  const removeNotification = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    
    // For temporary notifications, just remove from UI (no DB interaction)
    if (notification?.isTemporary) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      return
    }
    
    // For persistent notifications, delete from database
    if (notification?.isPersisted && notification.dbId) {
      try {
        await deleteNotification(notification.dbId)
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Error deleting notification from database:", error)
        // Still remove from UI even if DB delete fails
      }
    }
    
    // Remove from UI
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [notifications])

  // Add notification (immediate UI display, no persistence)
  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = notification.duration || 5000
    const timestamp = Date.now()

    setNotifications((prev) => {
      // Check if a notification with similar content already exists
      const hasExisting = prev.some(
        (item) => item.title === notification.title && item.message === notification.message
      )
      
      if (hasExisting) {
        return prev
      }
      
      return [...prev, { ...notification, id, timestamp }]
    })

    // Auto remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }, [removeNotification])

  // Add persistent notification (saves to database and shows in UI)
  const addPersistentNotification = useCallback(async (params: CreateNotificationParams) => {
    try {
      // Check for duplicate notifications created in the last 5 seconds
      const recentNotifications = await getNotifications({ 
        limit: 10 
      })
      
      const now = Date.now()
      const fiveSecondsAgo = now - 5000
      
      const hasRecentDuplicate = recentNotifications.some((notif) => {
        const notificationTime = new Date(notif.created_at).getTime()
        return (
          notif.title === params.title &&
          notif.message === params.message &&
          notificationTime > fiveSecondsAgo
        )
      })
      
      if (hasRecentDuplicate) {
        console.log("[addPersistentNotification] Duplicate notification detected, skipping creation")
        return
      }
      
      // Show temporary hover notification immediately in UI (auto-dismisses after 4 seconds)
      const tempId = Math.random().toString(36).substring(2, 9)
      const timestamp = Date.now()
      
      const tempNotification: Notification = {
        id: tempId,
        type: params.type,
        title: params.title,
        message: params.message,
        timestamp,
        isPersisted: false,
        isTemporary: true, // Mark as temporary hover notification
        duration: 4000, // Auto-dismiss after 4 seconds
      }

      setNotifications((prev) => {
        // Also check for duplicate temporary notifications in UI
        const hasExistingTemp = prev.some(
          (item) => item.title === params.title && item.message === params.message && item.isTemporary
        )
        if (hasExistingTemp) {
          return prev
        }
        return [...prev, tempNotification]
      })
      // Don't increment unreadCount for temporary notifications
      // The count will be updated when database notifications are loaded

      // Auto-remove temporary notification after duration
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== tempId))
      }, 4000)

      // Save to database (this creates a separate persistent notification)
      const dbNotification = await createNotification(params)
      
      // Optimistically add the notification to state immediately (realtime will also update it)
      const uiNotification = dbNotificationToUI(dbNotification)
      setNotifications((prev) => {
        // Check if notification already exists (avoid duplicates)
        const exists = prev.some(n => n.dbId === dbNotification.id)
        if (exists) {
          return prev
        }
        
        // Check if we're on notifications page using ref
        const isOnNotificationsPage = pathnameRef.current === "/notifications"
        
        // If on notifications page, add to list (at the top)
        if (isOnNotificationsPage) {
          const activeTemporaryNotifications = prev.filter(n => n.isTemporary)
          const existingDbNotifications = prev.filter(n => !n.isTemporary && n.dbId !== dbNotification.id)
          return [uiNotification, ...activeTemporaryNotifications, ...existingDbNotifications]
        }
        
        // Otherwise, keep temporary notifications only (realtime will handle adding it if needed)
        return prev.filter(n => n.isTemporary)
      })
      
      // Update unread count immediately
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error("Error creating persistent notification:", error)
      // Temporary notification still shows in UI even if DB save fails
    }
  }, [dbNotificationToUI])

  const clearAllNotifications = useCallback(async () => {
    try {
      console.log("[clearAllNotifications] Deleting all notifications from database")
      // Delete all notifications from database
      await deleteAllNotifications()
      console.log("[clearAllNotifications] Successfully deleted all notifications")
      
      // Clear UI state
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error("[clearAllNotifications] Error deleting all notifications:", error)
      // Still clear UI even if DB delete fails
      setNotifications([])
      setUnreadCount(0)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    
    if (notification?.isPersisted && notification.dbId) {
      try {
        console.log(`[markAsRead] Marking notification as read: ${notification.dbId}`)
        // Mark as read in database
        await markAsReadService(notification.dbId)
        console.log(`[markAsRead] Successfully marked notification as read: ${notification.dbId}`)
        
        // Update unread count
        const newCount = await getUnreadCount()
        setUnreadCount(newCount)
        
        // Update notification in UI to reflect read status
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          )
        )
      } catch (error) {
        console.error("[markAsRead] Error marking notification as read:", error)
      }
    } else {
      // For temporary notifications, just remove from UI
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
  }, [notifications])

  const markAllAsRead = useCallback(async () => {
    try {
      console.log(`[markAllAsRead] Marking all notifications as read`)
      // Mark all notifications as read in database
      await markAllAsReadService()
      console.log(`[markAllAsRead] Successfully marked all notifications as read`)
      
      // Update unread count to 0
      setUnreadCount(0)
      
      // Update all persisted notifications in UI to reflect read status (keep temporary ones unchanged)
      setNotifications((prev) =>
        prev.map((n) => 
          n.isPersisted ? { ...n, is_read: true } : n
        )
      )
    } catch (error) {
      console.error("[markAllAsRead] Error marking all notifications as read:", error)
      throw error
    }
  }, [])

  // Check for low stock items and show notifications
  // Automatic inventory notifications are disabled
  // Uncomment this useEffect if you want to re-enable automatic inventory notifications
  /*
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
  */

  const value = {
    notifications,
    addNotification,
    addPersistentNotification,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    loadNotifications,
    unreadCount,
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
  
  // Only show temporary notifications in hover (not persistent ones from DB)
  const temporaryNotifications = notifications.filter(n => n.isTemporary)

  return (
    <div className="fixed top-4 z-50 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4 flex flex-col items-center">
      <AnimatePresence>
        {temporaryNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: index * -8, // Create a slight stacking effect
              scale: 1 - (index * 0.02), // Slightly scale down stacked notifications
              zIndex: temporaryNotifications.length - index // Control stacking order
            }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{ 
              position: 'relative',
              marginTop: index === 0 ? 0 : '-70px', // Create overlap effect
              width: '100%'
            }}
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
  onClose: (id: string) => Promise<void>
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
      className={`rounded-lg shadow-lg border-2 p-4 flex items-start w-full backdrop-blur-xl bg-background/60 ${getBorderColor()}`}
      style={{ 
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)"
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
        onClick={() => onClose(id).catch(err => console.error("Error closing notification:", err))} 
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label="Close notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  )
} 