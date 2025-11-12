import { createClient } from "@/supabase/client";

export type NotificationType = "success" | "error" | "warning" | "info";
export type NotificationCategory = "inventory" | "lubricant" | "stock" | "system" | "other";

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  category?: NotificationCategory;
  metadata?: Record<string, any>;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  category: NotificationCategory | null;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  is_read?: boolean;
  category?: NotificationCategory;
  limit?: number;
}

/**
 * Create a new notification in the database
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<NotificationRecord> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to create notifications");
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      type: params.type,
      title: params.title,
      message: params.message,
      category: params.category || null,
      metadata: params.metadata || {},
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return data as NotificationRecord;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(
  filters?: NotificationFilters
): Promise<NotificationRecord[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.is_read !== undefined) {
    query = query.eq("is_read", filters.is_read);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return (data || []) as NotificationRecord[];
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to mark notifications as read");
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id); // Ensure user can only update their own notifications

  if (error) {
    console.error("Error marking notification as read:", error);
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead(): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to mark notifications as read");
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("is_read", false); // Only update unread notifications

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to delete notifications");
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id); // Ensure user can only delete their own notifications

  if (error) {
    console.error("Error deleting notification:", error);
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
}

/**
 * Delete all notifications for the current user
 */
export async function deleteAllNotifications(): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to delete notifications");
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id); // Delete all notifications for this user

  if (error) {
    console.error("Error deleting all notifications:", error);
    throw new Error(`Failed to delete all notifications: ${error.message}`);
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }

  return count || 0;
}

