"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { usePathname } from "next/navigation";

import { createClient } from "@/supabase/client";
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
} from "@/lib/services/notificationService";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  timestamp: number;
  isPersisted?: boolean; // Whether this notification is saved in the database
  dbId?: string; // Database ID if persisted
  isTemporary?: boolean; // Whether this is a temporary hover notification that should auto-dismiss
  is_read?: boolean; // Whether this notification has been read
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => void;
  addPersistentNotification: (
    params: CreateNotificationParams,
  ) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadNotifications: (includeRead?: boolean) => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const realtimeChannelRef = useRef<any>(null);

  // Update pathname ref whenever pathname changes
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Convert database notification to UI notification
  const dbNotificationToUI = useCallback(
    (dbNotif: NotificationRecord): Notification => {
      return {
        id: `db-${dbNotif.id}`,
        type: dbNotif.type,
        title: dbNotif.title,
        message: dbNotif.message,
        timestamp: new Date(dbNotif.created_at).getTime(),
        isPersisted: true,
        dbId: dbNotif.id,
        is_read: dbNotif.is_read,
      };
    },
    [],
  );

  // Load notifications from database (only for notifications page)
  const loadNotifications = useCallback(
    async (includeRead: boolean = false) => {
      try {
        setIsLoading(true);
        // Load unread notifications to update unread count
        const unreadNotifications = await getNotifications({
          is_read: false,
          limit: 50,
        });

        // Update unread count
        setUnreadCount(unreadNotifications.length);

        // If includeRead is true (notifications page), load all notifications
        if (includeRead) {
          const readNotifications = await getNotifications({
            is_read: true,
            limit: 50,
          });
          const allNotifications = [
            ...unreadNotifications,
            ...readNotifications,
          ];

          // Convert to UI format
          const dbUI = allNotifications.map(dbNotificationToUI);

          // On notifications page: replace all notifications with DB ones (keep temporary ones that are still active)
          setNotifications((prev) => {
            const activeTemporaryNotifications = prev.filter(
              (n) => n.isTemporary,
            );
            return [...activeTemporaryNotifications, ...dbUI];
          });
        } else {
          // For hover context: DON'T load DB notifications, only update unread count
          // Hover should only show temporary notifications
          // Keep existing temporary notifications
          setNotifications((prev) => prev.filter((n) => n.isTemporary));
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [dbNotificationToUI],
  );

  // Set up realtime subscriptions for notifications
  // Two channels:
  //   1. 'stock-alerts' broadcast channel: receives instant stock alerts from the DB trigger via realtime.send()
  //   2. 'notifications:{userId}' postgres_changes channel: handles UPDATE/DELETE for mark-as-read and deletion
  useEffect(() => {
    let stockAlertsChannel: ReturnType<typeof supabase.channel> | null = null;
    let notificationsChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return;
        }

        // ── Channel 1: Stock Alerts via Broadcast ──────────────────────
        // The DB trigger calls realtime.send() on topic 'stock-alerts'
        // with event 'stock_alert'. This is the primary, reliable delivery
        // mechanism for new stock notifications.
        stockAlertsChannel = supabase
          .channel("stock-alerts")
          .on("broadcast", { event: "stock_alert" }, async (payload) => {
            const data = payload.payload;
            if (!data) return;

            // Update unread count from DB
            const count = await getUnreadCount();
            setUnreadCount(count);

            // Show a temporary toast notification
            const tempId = `rt-toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setNotifications((prev) => {
              // Deduplicate by title + message within recent toasts
              const hasDuplicate = prev.some(
                (n) =>
                  n.title === data.title &&
                  n.message === data.message &&
                  n.isTemporary,
              );
              if (hasDuplicate) return prev;

              const toast: Notification = {
                id: tempId,
                type: data.type as NotificationType,
                title: data.title,
                message: data.message,
                timestamp: Date.now(),
                isPersisted: false,
                isTemporary: true,
                duration: 5000,
              };
              return [...prev, toast];
            });

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              setNotifications((prev) => prev.filter((n) => n.id !== tempId));
            }, 5000);

            // If on notifications page, reload persisted notifications
            if (pathnameRef.current === "/notifications") {
              await loadNotifications(true);
            }
          })
          .subscribe();

        // ── Channel 2: Postgres Changes for UPDATE/DELETE ──────────────
        // This handles mark-as-read and delete operations on the notifications table.
        // These are user-initiated actions that work reliably via postgres_changes.
        notificationsChannel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              const updatedNotification = payload.new as NotificationRecord;
              const uiNotification = dbNotificationToUI(updatedNotification);

              const count = await getUnreadCount();
              setUnreadCount(count);

              setNotifications((prev) =>
                prev.map((n) =>
                  n.dbId === updatedNotification.id ? uiNotification : n,
                ),
              );
            },
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              const deletedId = payload.old.id;

              const count = await getUnreadCount();
              setUnreadCount(count);

              setNotifications((prev) =>
                prev.filter((n) => n.dbId !== deletedId),
              );
            },
          )
          .subscribe();

        realtimeChannelRef.current = stockAlertsChannel;
      } catch (error) {
        console.error("Error setting up realtime subscription:", error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (stockAlertsChannel) supabase.removeChannel(stockAlertsChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
    };
  }, [supabase, dbNotificationToUI, loadNotifications]);

  // Update unread count periodically (for badge display) - reduced frequency since we have realtime
  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Error updating unread count:", error);
      }
    };

    // Update immediately
    updateUnreadCount();

    // Update every 60 seconds as a fallback (realtime handles most updates)
    const interval = setInterval(updateUnreadCount, 60000);

    return () => clearInterval(interval);
  }, []);

  // Remove notification helper (defined first to avoid circular dependency)
  const removeNotification = useCallback(
    async (id: string) => {
      const notification = notifications.find((n) => n.id === id);

      // For temporary notifications, just remove from UI (no DB interaction)
      if (notification?.isTemporary) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        return;
      }

      // For persistent notifications, delete from database
      if (notification?.isPersisted && notification.dbId) {
        try {
          await deleteNotification(notification.dbId);
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
          console.error("Error deleting notification from database:", error);
          // Still remove from UI even if DB delete fails
        }
      }

      // Remove from UI
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [notifications],
  );

  // Add notification (immediate UI display, no persistence)
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = notification.duration || 5000;
      const timestamp = Date.now();

      setNotifications((prev) => {
        // Check if a notification with similar content already exists
        const hasExisting = prev.some(
          (item) =>
            item.title === notification.title &&
            item.message === notification.message,
        );

        if (hasExisting) {
          return prev;
        }

        return [...prev, { ...notification, id, timestamp }];
      });

      // Auto remove notification after duration
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification],
  );

  // Add persistent notification (saves to database and shows in UI)
  const addPersistentNotification = useCallback(
    async (params: CreateNotificationParams) => {
      try {
        // Check for duplicate notifications created in the last 5 seconds
        const recentNotifications = await getNotifications({
          limit: 10,
        });

        const now = Date.now();
        const fiveSecondsAgo = now - 5000;

        const hasRecentDuplicate = recentNotifications.some((notif) => {
          const notificationTime = new Date(notif.created_at).getTime();
          return (
            notif.title === params.title &&
            notif.message === params.message &&
            notificationTime > fiveSecondsAgo
          );
        });

        if (hasRecentDuplicate) {
          console.log(
            "[addPersistentNotification] Duplicate notification detected, skipping creation",
          );
          return;
        }

        // Show temporary hover notification immediately in UI (auto-dismisses after 4 seconds)
        const tempId = Math.random().toString(36).substring(2, 9);
        const timestamp = Date.now();

        const tempNotification: Notification = {
          id: tempId,
          type: params.type,
          title: params.title,
          message: params.message,
          timestamp,
          isPersisted: false,
          isTemporary: true, // Mark as temporary hover notification
          duration: 4000, // Auto-dismiss after 4 seconds
        };

        setNotifications((prev) => {
          // Also check for duplicate temporary notifications in UI
          const hasExistingTemp = prev.some(
            (item) =>
              item.title === params.title &&
              item.message === params.message &&
              item.isTemporary,
          );
          if (hasExistingTemp) {
            return prev;
          }
          return [...prev, tempNotification];
        });
        // Don't increment unreadCount for temporary notifications
        // The count will be updated when database notifications are loaded

        // Auto-remove temporary notification after duration
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== tempId));
        }, 4000);

        // Save to database (this creates a separate persistent notification)
        const dbNotification = await createNotification(params);

        // Optimistically add the notification to state immediately (realtime will also update it)
        const uiNotification = dbNotificationToUI(dbNotification);
        setNotifications((prev) => {
          // Check if notification already exists (avoid duplicates)
          const exists = prev.some((n) => n.dbId === dbNotification.id);
          if (exists) {
            return prev;
          }

          // Check if we're on notifications page using ref
          const isOnNotificationsPage =
            pathnameRef.current === "/notifications";

          // If on notifications page, add to list (at the top)
          if (isOnNotificationsPage) {
            const activeTemporaryNotifications = prev.filter(
              (n) => n.isTemporary,
            );
            const existingDbNotifications = prev.filter(
              (n) => !n.isTemporary && n.dbId !== dbNotification.id,
            );
            return [
              uiNotification,
              ...activeTemporaryNotifications,
              ...existingDbNotifications,
            ];
          }

          // Otherwise, keep temporary notifications only (realtime will handle adding it if needed)
          return prev.filter((n) => n.isTemporary);
        });

        // Update unread count immediately
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Error creating persistent notification:", error);
        // Temporary notification still shows in UI even if DB save fails
      }
    },
    [dbNotificationToUI],
  );

  const clearAllNotifications = useCallback(async () => {
    try {
      console.log(
        "[clearAllNotifications] Deleting all notifications from database",
      );
      // Delete all notifications from database
      await deleteAllNotifications();
      console.log(
        "[clearAllNotifications] Successfully deleted all notifications",
      );

      // Clear UI state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error(
        "[clearAllNotifications] Error deleting all notifications:",
        error,
      );
      // Still clear UI even if DB delete fails
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      const notification = notifications.find((n) => n.id === id);

      if (notification?.isPersisted && notification.dbId) {
        try {
          console.log(
            `[markAsRead] Marking notification as read: ${notification.dbId}`,
          );
          // Mark as read in database
          await markAsReadService(notification.dbId);
          console.log(
            `[markAsRead] Successfully marked notification as read: ${notification.dbId}`,
          );

          // Update unread count
          const newCount = await getUnreadCount();
          setUnreadCount(newCount);

          // Update notification in UI to reflect read status
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
          );
        } catch (error) {
          console.error(
            "[markAsRead] Error marking notification as read:",
            error,
          );
        }
      } else {
        // For temporary notifications, just remove from UI
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      console.log(`[markAllAsRead] Marking all notifications as read`);
      // Mark all notifications as read in database
      await markAllAsReadService();
      console.log(
        `[markAllAsRead] Successfully marked all notifications as read`,
      );

      // Update unread count to 0
      setUnreadCount(0);

      // Update all persisted notifications in UI to reflect read status (keep temporary ones unchanged)
      setNotifications((prev) =>
        prev.map((n) => (n.isPersisted ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error(
        "[markAllAsRead] Error marking all notifications as read:",
        error,
      );
      throw error;
    }
  }, []);

  // Stock notifications are handled entirely by the PostgreSQL trigger
  // `notify_stock_alert()` on the inventory table. When stock crosses
  // thresholds, the trigger inserts into the notifications table, and
  // the Realtime subscription above surfaces them automatically.

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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  // Only show temporary notifications in hover (not persistent ones from DB)
  const temporaryNotifications = notifications.filter((n) => n.isTemporary);

  return (
    <div className="fixed top-4 z-[99999] left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4 flex flex-col items-center">
      <AnimatePresence>
        {temporaryNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: index * -8, // Create a slight stacking effect
              scale: 1 - index * 0.02, // Slightly scale down stacked notifications
              zIndex: temporaryNotifications.length - index, // Control stacking order
            }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "relative",
              marginTop: index === 0 ? 0 : "-70px", // Create overlap effect
              width: "100%",
            }}
          >
            <NotificationItem
              notification={notification}
              onClose={removeNotification}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClose: (id: string) => Promise<void>;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { id, type, title, message } = notification;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      case "warning":
        return "border-amber-500";
      case "info":
        return "border-blue-500";
      default:
        return "border-blue-500";
    }
  };

  return (
    <div
      className={`rounded-lg shadow-lg border-2 p-4 flex items-start w-full backdrop-blur-xl bg-background/60 ${getBorderColor()}`}
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        {title && <h3 className="font-medium text-sm truncate">{title}</h3>}
        <p className="text-sm text-muted-foreground mt-1 break-words">
          {message}
        </p>
      </div>
      <button
        onClick={() =>
          onClose(id).catch((err) =>
            console.error("Error closing notification:", err),
          )
        }
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label="Close notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
