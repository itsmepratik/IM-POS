"use client"

import { useState, useEffect } from "react"
import { useNotification } from "./notification-context"
import { Button } from "@/components/ui/button"
import { Inbox, X, Bell, CheckCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'

export function NotificationDemo() {
  const { notifications, removeNotification, clearAllNotifications, addNotification } = useNotification()
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDemoBox, setShowDemoBox] = useState(false)

  // Initialize after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isExpanded]);

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

  // Show a simple button during SSR to avoid hydration issues
  if (!mounted) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="rounded-full w-12 h-12 bg-background shadow-lg border flex items-center justify-center">
          <Inbox className="h-5 w-5 text-foreground" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* Test notifications button */}
        <button
          className="rounded-full w-12 h-12 bg-background shadow-lg border flex items-center justify-center hover:bg-muted transition-colors relative"
          onClick={() => setShowDemoBox(!showDemoBox)}
          aria-label="Show notification demo"
        >
          <Bell className="h-5 w-5" />
        </button>
        
        {/* Inbox button */}
        <button
          className="rounded-full w-12 h-12 bg-background shadow-lg border flex items-center justify-center hover:bg-muted transition-colors relative"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Open notifications inbox"
        >
          <Inbox className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-blue-500"
            >
              {notifications.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Demo notification box */}
      <AnimatePresence>
        {showDemoBox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 bg-background/60 backdrop-blur-xl shadow-lg border rounded-xl p-4 w-60"
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)"
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Test Notifications</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0" 
                onClick={() => setShowDemoBox(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-green-500 text-green-500 hover:bg-green-500/10"
                onClick={() => sendTestNotification("success")}
              >
                Success
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={() => sendTestNotification("error")}
              >
                Error
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-amber-500 text-amber-500 hover:bg-amber-500/10"
                onClick={() => sendTestNotification("warning")}
              >
                Warning
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-blue-500 text-blue-500 hover:bg-blue-500/10"
                onClick={() => sendTestNotification("info")}
              >
                Info
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
            />

            {/* Inbox panel */}
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed bottom-20 right-4 w-[min(calc(100vw-2rem),400px)] max-h-[min(calc(100vh-8rem),600px)] bg-background/60 backdrop-blur-xl rounded-xl shadow-xl border z-50 flex flex-col overflow-hidden"
              style={{ 
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)"
              }}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h2 className="font-medium">Notifications</h2>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs flex gap-1"
                      onClick={clearAllNotifications}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Mark all read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                    <div className="bg-muted/30 rounded-full p-6 mb-4">
                      <Inbox className="h-12 w-12 opacity-40" />
                    </div>
                    <p className="font-medium text-sm">Your inbox is empty</p>
                    <p className="text-xs mt-2 max-w-[200px] text-muted-foreground/70">
                      New notifications will appear here when you receive them
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                      >
                        <div 
                          className={`
                            rounded-lg border-2 bg-card/60 p-3 shadow-sm flex items-start gap-3
                            hover:bg-muted/30 transition-colors cursor-default
                            ${notification.type === 'success' ? 'border-green-500' : ''}
                            ${notification.type === 'error' ? 'border-red-500' : ''}
                            ${notification.type === 'warning' ? 'border-amber-500' : ''}
                            ${notification.type === 'info' ? 'border-blue-500' : ''}
                          `}
                          style={{
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)"
                          }}
                        >
                          <div>
                            {notification.type === 'success' && <div className="h-2 w-2 rounded-full bg-green-500" />}
                            {notification.type === 'error' && <div className="h-2 w-2 rounded-full bg-red-500" />}
                            {notification.type === 'warning' && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                            {notification.type === 'info' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                {notification.title && (
                                  <p className="font-medium text-sm leading-tight text-foreground">{notification.title}</p>
                                )}
                                <p className="text-xs text-muted-foreground/90 mt-1">{notification.message}</p>
                                <p className="text-[10px] text-muted-foreground/70 mt-2">
                                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                </p>
                              </div>
                              <Button 
                                onClick={() => removeNotification(notification.id)} 
                                className="rounded-full h-6 w-6 p-0" 
                                variant="ghost" 
                                size="sm"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 