"use client"

import { useState, useEffect } from "react"
import { useNotification } from "./notification-context"
import { Button } from "@/components/ui/button"
import { Inbox, X, Bell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NotificationDemo() {
  const { notifications, addNotification } = useNotification()
  const [mounted, setMounted] = useState(false)

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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Test notifications button with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full w-12 h-12 bg-background shadow-lg border flex items-center justify-center hover:bg-muted transition-colors relative"
            aria-label="Test notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-2">
          <div className="px-2 py-1.5 text-sm font-medium">Test Notifications</div>
          <DropdownMenuItem
            className="cursor-pointer text-green-500 focus:text-green-600 focus:bg-green-50"
            onClick={() => sendTestNotification("success")}
          >
            Success
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50"
            onClick={() => sendTestNotification("error")}
          >
            Error
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-amber-500 focus:text-amber-600 focus:bg-amber-50"
            onClick={() => sendTestNotification("warning")}
          >
            Warning
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-blue-500 focus:text-blue-600 focus:bg-blue-50"
            onClick={() => sendTestNotification("info")}
          >
            Info
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Inbox button */}
      <Link
        href="/notifications"
        className="rounded-full w-12 h-12 bg-background shadow-lg border flex items-center justify-center hover:bg-muted transition-colors relative"
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
      </Link>
    </div>
  )
} 