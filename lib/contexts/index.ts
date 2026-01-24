// Re-export all contexts from lib/contexts for cleaner imports
export { UserProvider, useUser } from './UserContext';
export type { UserRole, Permission } from './UserContext';

export { NotificationProvider, useNotification } from './NotificationContext';
export type { CreateNotificationParams } from '@/lib/services/notificationService';

export { DataProvider } from './DataProvider';
export { useBranch, BranchProvider } from './BranchContext';
export { AuthProvider, useAuth } from './AuthContext';
