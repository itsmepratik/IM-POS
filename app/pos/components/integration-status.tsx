/**
 * Integration Status Component
 *
 * Shows the status of the Inventory-POS integration and provides debugging information
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  ShoppingCart,
  Sync,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIntegratedPOSData } from "@/lib/hooks/data/useIntegratedPOSData";

interface IntegrationStatusProps {
  className?: string;
}

export function IntegrationStatus({ className }: IntegrationStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    lubricantProducts,
    products,
    isLoading,
    error,
    lastSyncTime,
    syncProducts,
  } = useIntegratedPOSData();

  const totalProducts = lubricantProducts.length + products.length;
  const availableProducts = [...lubricantProducts, ...products].filter(
    (p) => p.isAvailable
  ).length;
  const unavailableProducts = totalProducts - availableProducts;

  // Calculate integration health status
  const getIntegrationStatus = () => {
    if (error) {
      return {
        status: "error" as const,
        message: "Integration Error",
        description: error,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: <XCircle className="h-5 w-5 text-red-600" />,
      };
    }

    if (isLoading) {
      return {
        status: "loading" as const,
        message: "Syncing Data",
        description: "Fetching latest inventory data...",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: <Sync className="h-5 w-5 text-orange-600 animate-spin" />,
      };
    }

    if (totalProducts === 0) {
      return {
        status: "warning" as const,
        message: "No Products",
        description: "No products found in inventory",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
      };
    }

    return {
      status: "success" as const,
      message: "Integration Active",
      description: `${totalProducts} products synchronized`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    };
  };

  const integrationStatus = getIntegrationStatus();

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {integrationStatus.icon}
                <div>
                  <CardTitle className="text-lg">
                    {integrationStatus.message}
                  </CardTitle>
                  <CardDescription>
                    {integrationStatus.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    integrationStatus.borderColor,
                    integrationStatus.bgColor,
                    integrationStatus.color
                  )}
                >
                  {integrationStatus.status}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Product Stats */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Database className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-medium">Total Products</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                  <p className="text-sm text-muted-foreground">
                    {lubricantProducts.length} lubricants, {products.length}{" "}
                    others
                  </p>
                </div>
              </div>

              {/* Availability Stats */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {availableProducts}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {unavailableProducts} out of stock
                  </p>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Clock className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">Last Sync</p>
                  <p className="text-sm font-bold">
                    {lastSyncTime ? lastSyncTime.toLocaleTimeString() : "Never"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lastSyncTime
                      ? `${Math.round(
                          (Date.now() - lastSyncTime.getTime()) / 1000
                        )}s ago`
                      : "No sync yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Integration Features */}
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Integration Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Real-time inventory sync</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Stock level validation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Automatic stock deduction</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Branch-specific inventory</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Lubricant volume tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Error handling & recovery</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncProducts}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Sync className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Force Sync
              </Button>

              {error && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reload Page
                </Button>
              )}
            </div>

            {/* Error Details */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <h5 className="font-medium text-red-800 mb-1">Error Details</h5>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
