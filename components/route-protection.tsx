"use client";

import { useUser, type Permission } from "@/app/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  adminOnly?: boolean;
  fallbackPath?: string;
}

export function RouteProtection({
  children,
  requiredPermission,
  adminOnly = false,
  fallbackPath = "/pos",
}: RouteProtectionProps) {
  const { currentUser, hasPermission, isAdmin, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // If no user is logged in, redirect will be handled by middleware
    if (!currentUser) return;

    // Check admin access
    if (adminOnly && !isAdmin()) {
      router.push(fallbackPath);
      return;
    }

    // Check specific permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(fallbackPath);
      return;
    }
  }, [
    currentUser,
    isLoading,
    adminOnly,
    requiredPermission,
    hasPermission,
    isAdmin,
    router,
    fallbackPath,
  ]);

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If no user, let middleware handle redirect
  if (!currentUser) {
    return null;
  }

  // Check permissions
  if (adminOnly && !isAdmin()) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component for easy page wrapping
export function withRouteProtection(
  Component: React.ComponentType<any>,
  options: Omit<RouteProtectionProps, "children"> = {}
) {
  return function ProtectedComponent(props: any) {
    return (
      <RouteProtection {...options}>
        <Component {...props} />
      </RouteProtection>
    );
  };
}
