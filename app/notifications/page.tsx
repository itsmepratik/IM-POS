"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/lib/contexts/NotificationContext";
import { Layout } from "@/components/layout";
import { 
  Bell, 
  X, 
  Check, 
  Inbox, 
  ChevronLeft, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/page-title";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const {
    notifications,
    removeNotification,
    clearAllNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    loadNotifications,
    unreadCount,
  } = useNotification();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    loadNotifications(true);
  }, [loadNotifications]);

  if (!mounted) {
    return (
      <Layout>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  // Helper to get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error": return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info": return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    // Sort by unread first, then date
    if (a.is_read === b.is_read) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return a.is_read ? 1 : -1;
  });

  const persistedNotifications = sortedNotifications.filter(n => !n.isTemporary);

  return (
    <Layout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <PageHeader
          actions={
            persistedNotifications.length > 0 ? (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await markAllAsRead();
                      await loadNotifications(true);
                    }}
                    className="text-xs h-8"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await clearAllNotifications();
                    loadNotifications(true);
                  }}
                  className="text-xs h-8 text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </Button>
              </div>
            ) : null
          }
        />

        {persistedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-lg text-foreground">All caught up</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              You don't have any new notifications at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {persistedNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      "group flex gap-4 p-4 rounded-xl border transition-all duration-200 relative overflow-hidden",
                      notification.is_read 
                        ? "bg-green-50/5 border-green-500/20 hover:bg-green-50/10" 
                        : "bg-[#f9fafb] border-border/40 shadow-sm shadow-black/5 hover:border-border hover:shadow-md hover:shadow-black/5 ring-1 ring-inset ring-white/5"
                    )}
                    style={{
                      boxShadow: !notification.is_read ? "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)" : "none"
                    }}
                  >
                    {/* Status Indicator / Icon */}
                    <div className="mt-0.5 shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-semibold leading-none",
                            !notification.is_read && "text-foreground"
                          )}>
                            {notification.title}
                          </p>
                          <Badge 
                            variant={notification.is_read ? "success" : "default"}
                            className={cn(
                              "text-[9px] h-4 px-1.5 uppercase tracking-wider font-bold",
                              !notification.is_read && "bg-blue-600 hover:bg-blue-600"
                            )}
                          >
                            {notification.is_read ? "Read" : "Unread"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground/80 tabular-nums">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await removeNotification(notification.id);
                              loadNotifications(true);
                            }}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-[90%]">
                        {notification.message}
                      </p>
                      
                      {!notification.is_read && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-3 text-[11px] font-medium bg-white shadow-sm border border-border/50 hover:bg-white/90"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await markAsRead(notification.id);
                              await loadNotifications(true);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1.5 text-blue-500" />
                            Mark as read
                          </Button>
                        </div>
                      )}
                    </div>


                  </div>
                  <div className="h-px bg-border/40 mx-4" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
}
