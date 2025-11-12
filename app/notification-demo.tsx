"use client";

import { useState, useEffect } from "react";
import { useNotification } from "./notification-context";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function NotificationDemo() {
  const { notifications, addNotification } = useNotification();
  const [mounted, setMounted] = useState(false);

  // Initialize after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Demo notification functions
  const sendTestNotification = (
    type: "success" | "error" | "warning" | "info"
  ) => {
    const notificationData = {
      success: {
        title: "Success Notification",
        message: "Your action was completed successfully!",
        duration: 5000,
      },
      error: {
        title: "Error Notification",
        message: "Something went wrong. Please try again.",
        duration: 5000,
      },
      warning: {
        title: "Warning Notification",
        message: "This action might have unexpected results.",
        duration: 5000,
      },
      info: {
        title: "Information",
        message: "Here's something you might want to know.",
        duration: 5000,
      },
    };

    addNotification({
      type,
      ...notificationData[type],
    });
  };

  // Show a simple button during SSR to avoid hydration issues
  if (!mounted) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <div className="rounded-full w-12 h-12 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <Bell className="h-5 w-5 text-gray-900 dark:text-gray-100" suppressHydrationWarning />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {/* Test notifications button with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full w-12 h-12 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative text-gray-900 dark:text-gray-100"
            aria-label="Test notifications"
          >
            <Bell className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          side="top"
          sideOffset={8}
          className="w-48 p-2 mb-2"
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium">
            Test Notifications
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
            onAction={() => sendTestNotification("success")}
          >
            Success
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
            onAction={() => sendTestNotification("error")}
          >
            Error
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
            onAction={() => sendTestNotification("warning")}
          >
            Warning
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
            onAction={() => sendTestNotification("info")}
          >
            Info
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
