"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Sync,
  Clock,
  Database,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutHealthMonitorProps {
  className?: string;
  compact?: boolean;
}

interface HealthStatus {
  connection: "online" | "offline" | "unstable";
  database: "healthy" | "unhealthy" | "unknown";
  offlineTransactions: number;
  lastSync: string | null;
  circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
}

export function CheckoutHealthMonitor({
  className,
  compact = false,
}: CheckoutHealthMonitorProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    connection: "unknown" as any,
    database: "unknown",
    offlineTransactions: 0,
    lastSync: null,
    circuitState: "CLOSED",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    try {
      // Check online status
      const isOnline = navigator.onLine;

      // Dynamic import to avoid SSR issues
      const { checkoutService } = await import(
        "@/lib/services/checkout-service"
      );

      // Get checkout service status
      const circuitStatus = checkoutService.getCircuitStatus();
      const offlineCount = checkoutService.getOfflineTransactionCount();

      // Test database connection
      let dbStatus: "healthy" | "unhealthy" | "unknown" = "unknown";
      try {
        const response = await fetch("/api/debug/database", {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        dbStatus = response.ok ? "healthy" : "unhealthy";
      } catch {
        dbStatus = "unhealthy";
      }

      setHealthStatus({
        connection: isOnline
          ? circuitStatus.failureCount > 0
            ? "unstable"
            : "online"
          : "offline",
        database: dbStatus,
        offlineTransactions: offlineCount,
        lastSync: circuitStatus.lastFailureTime
          ? new Date(circuitStatus.lastFailureTime).toLocaleTimeString()
          : null,
        circuitState: circuitStatus.state,
      });
    } catch (error) {
      console.error("Health check failed:", error);
      setHealthStatus((prev) => ({
        ...prev,
        connection: "offline",
        database: "unhealthy",
      }));
    }
  };

  const handleSync = async () => {
    setIsRefreshing(true);
    try {
      const { checkoutService } = await import(
        "@/lib/services/checkout-service"
      );
      await checkoutService.syncOfflineTransactions();
      await checkHealth(); // Refresh status after sync
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkHealth();

    // Set up periodic health checks
    const interval = setInterval(checkHealth, 30000); // Every 30 seconds

    // Listen to online/offline events
    const handleOnline = () => checkHealth();
    const handleOffline = () => checkHealth();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getConnectionIcon = () => {
    switch (healthStatus.connection) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-600" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case "unstable":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDatabaseIcon = () => {
    switch (healthStatus.database) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "unhealthy":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionBadge = () => {
    const variants = {
      online: "default" as const,
      offline: "destructive" as const,
      unstable: "secondary" as const,
      unknown: "outline" as const,
    };

    return (
      <Badge
        variant={
          variants[healthStatus.connection as keyof typeof variants] ||
          "outline"
        }
      >
        {healthStatus.connection}
      </Badge>
    );
  };

  const getDatabaseBadge = () => {
    const variants = {
      healthy: "default" as const,
      unhealthy: "destructive" as const,
      unknown: "outline" as const,
    };

    return (
      <Badge variant={variants[healthStatus.database]}>
        {healthStatus.database}
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getConnectionIcon()}
        {getDatabaseIcon()}
        {healthStatus.offlineTransactions > 0 && (
          <Badge variant="outline" className="text-xs">
            {healthStatus.offlineTransactions} offline
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
        >
          <RefreshCw
            className={cn("h-3 w-3", isRefreshing && "animate-spin")}
          />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Checkout System Status
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
            {healthStatus.offlineTransactions > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isRefreshing}
              >
                <Sync
                  className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")}
                />
                Sync ({healthStatus.offlineTransactions})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <div>
                <p className="font-medium text-sm">Network</p>
                <p className="text-xs text-muted-foreground">
                  Circuit: {healthStatus.circuitState.toLowerCase()}
                </p>
              </div>
            </div>
            {getConnectionBadge()}
          </div>

          {/* Database Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              {getDatabaseIcon()}
              <div>
                <p className="font-medium text-sm">Database</p>
                <p className="text-xs text-muted-foreground">
                  Connection health
                </p>
              </div>
            </div>
            {getDatabaseBadge()}
          </div>
        </div>

        {/* Offline Transactions */}
        {healthStatus.offlineTransactions > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-sm text-yellow-800">
                Offline Transactions Pending
              </span>
            </div>
            <p className="text-xs text-yellow-700 mb-2">
              {healthStatus.offlineTransactions} transaction(s) are stored
              offline and will sync when connection is restored.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isRefreshing || healthStatus.connection === "offline"}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            >
              <Sync
                className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")}
              />
              Sync Now
            </Button>
          </div>
        )}

        {/* Last Sync Info */}
        {healthStatus.lastSync && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Last activity: {healthStatus.lastSync}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

