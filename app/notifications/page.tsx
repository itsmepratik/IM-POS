"use client"

import { useState, useEffect } from "react"
import { useNotification } from "../notification-context"
import { Layout } from "@/components/layout"
import { 
  Bell, 
  X, 
  CheckCheck, 
  Inbox,
  ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import { AnimatePresence, motion } from "framer-motion"
import { PageHeader } from "@/components/page-title"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const { notifications, removeNotification, clearAllNotifications, addNotification } = useNotification()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Initialize after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Demo notification functions
  const sendTestNotification = (type: "success" | "error" | "warning" | "info") => {
    const notificationData = {
      success: {
        title: "Success Notification",
        message: "Your action was completed successfully!",
        duration: 5000
      },
      error: {
        title: "Error Notification",
        message: "Something went wrong. Please try again.",
        duration: 5000
      },
      warning: {
        title: "Warning Notification",
        message: "This action might have unexpected results.",
        duration: 5000
      },
      info: {
        title: "Information",
        message: "Here's something you might want to know.",
        duration: 5000
      }
    };

    addNotification({
      type,
      ...notificationData[type]
    });
  };

  if (!mounted) {
    return <Layout>
      <div className="p-6">Loading...</div>
    </Layout>
  }

  return (
    <Layout>
      <div className="w-full space-y-6">
        <PageHeader
          leftAction={
            <Button
              variant="ghost"
              size="sm" 
              className="h-8 w-8 p-0 mr-2"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          }
          actions={
            notifications.length > 0 ? (
              <Button
                variant="outline"
                onClick={clearAllNotifications}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark all read</span>
              </Button>
            ) : null
          }
        >
          Notifications
        </PageHeader>

        <div className="w-full max-w-3xl mx-auto">
          {notifications.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-center rounded-xl border bg-background/60 backdrop-blur-xl p-8"
              style={{
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
              }}
            >
              <div className="bg-muted/30 rounded-full p-6 mb-4">
                <Inbox className="h-12 w-12 opacity-40" />
              </div>
              <p className="font-medium text-lg">Your inbox is empty</p>
              <p className="text-muted-foreground mt-2 max-w-md">
                New notifications will appear here when you receive them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    layout
                  >
                    <div 
                      className={`
                        rounded-xl border-2 bg-card/60 p-4 shadow-sm hover:bg-card/80 transition-colors
                        ${notification.type === 'success' ? 'border-green-500' : ''}
                        ${notification.type === 'error' ? 'border-red-500' : ''}
                        ${notification.type === 'warning' ? 'border-amber-500' : ''}
                        ${notification.type === 'info' ? 'border-blue-500' : ''}
                      `}
                      style={{
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        borderRadius: "16px"
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div>
                          {notification.type === 'success' && <div className="h-3 w-3 rounded-full bg-green-500" />}
                          {notification.type === 'error' && <div className="h-3 w-3 rounded-full bg-red-500" />}
                          {notification.type === 'warning' && <div className="h-3 w-3 rounded-full bg-amber-500" />}
                          {notification.type === 'info' && <div className="h-3 w-3 rounded-full bg-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              {notification.title && (
                                <p className="font-medium text-foreground">{notification.title}</p>
                              )}
                              <p className="text-sm text-muted-foreground/90 mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground/70 mt-2">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <Button 
                              onClick={() => removeNotification(notification.id)} 
                              className="rounded-full h-8 w-8 p-0" 
                              variant="ghost" 
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {notifications.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={clearAllNotifications}
                    className="w-full max-w-xs"
                  >
                    Clear all notifications
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 