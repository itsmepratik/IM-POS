"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  SquareParking,
  User,
  Car,
  Trash2,
  RotateCcw,
  Clock,
  Scissors,
  PlusCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import { ParkedOrder, CartItem as CartItemType } from "../../types";

interface ParkedOrdersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  parkedOrders: ParkedOrder[];
  activeCart: CartItemType[];
  activeSubtotal: number;
  activeTotal: number;
  activeCustomer: any | null;
  activeDiscount: { type: "percentage" | "amount"; value: number } | null;
  activeCarPlateNumber?: string;
  onParkActiveCart: (note?: string) => void;
  onResumeOrder: (order: ParkedOrder) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function ParkedOrdersDialog({
  isOpen,
  onOpenChange,
  parkedOrders,
  activeCart,
  activeSubtotal,
  activeTotal,
  activeCustomer,
  activeDiscount,
  activeCarPlateNumber,
  onParkActiveCart,
  onResumeOrder,
  onDeleteOrder,
}: ParkedOrdersDialogProps) {
  const [parkNote, setParkNote] = useState("");
  const [pendingResumeOrder, setPendingResumeOrder] =
    useState<ParkedOrder | null>(null);

  const handleParkCurrent = () => {
    onParkActiveCart(parkNote.trim() || undefined);
    setParkNote("");
  };

  const handleResumeClick = (order: ParkedOrder) => {
    if (activeCart.length > 0) {
      setPendingResumeOrder(order);
    } else {
      onResumeOrder(order);
      onOpenChange(false);
    }
  };

  const confirmResume = () => {
    if (pendingResumeOrder) {
      onResumeOrder(pendingResumeOrder);
      setPendingResumeOrder(null);
      onOpenChange(false);
    }
  };

  const cancelResume = () => {
    setPendingResumeOrder(null);
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isValid(date)) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] flex flex-col p-6 rounded-2xl">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <SquareParking className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Parked Orders
                {parkedOrders.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 font-semibold text-xs"
                  >
                    {parkedOrders.length}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Park current cart or resume previously parked orders
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Pending Resume Confirmation Banner */}
        {pendingResumeOrder && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3 mt-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Replace Active Cart?</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  You currently have {activeCart.length} item(s) in your active cart.
                  Resuming order #{pendingResumeOrder.orderNumber} will replace the active cart items.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={cancelResume}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs bg-amber-700 hover:bg-amber-800 text-white"
                onClick={confirmResume}
              >
                Yes, Resume Order
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2 min-h-0">
          {/* Park Current Active Cart Section */}
          {activeCart.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-700" />
                  <span className="font-semibold text-sm text-slate-800">
                    Active Cart ({activeCart.length} item{activeCart.length > 1 ? "s" : ""})
                  </span>
                </div>
                <span className="font-bold text-sm text-slate-900">
                  OMR {activeTotal.toFixed(3)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {activeCustomer && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border text-slate-700 font-medium">
                    <User className="h-3 w-3 text-blue-600" />
                    {activeCustomer.name}
                  </span>
                )}
                {activeCarPlateNumber && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border text-slate-700 font-medium">
                    <Car className="h-3 w-3 text-emerald-600" />
                    {activeCarPlateNumber}
                  </span>
                )}
                {activeDiscount && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border text-slate-700 font-medium">
                    <Scissors className="h-3 w-3 text-amber-600" />
                    Discount:{" "}
                    {activeDiscount.type === "percentage"
                      ? `${activeDiscount.value}%`
                      : `OMR ${activeDiscount.value.toFixed(3)}`}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add optional note or reference (e.g. Customer at ATM)..."
                  value={parkNote}
                  onChange={(e) => setParkNote(e.target.value)}
                  className="h-9 text-xs flex-1 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleParkCurrent();
                    }
                  }}
                />
                <Button
                  onClick={handleParkCurrent}
                  size="sm"
                  className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium shrink-0 rounded-lg text-xs"
                >
                  <SquareParking className="h-4 w-4" />
                  Park Cart
                </Button>
              </div>
            </div>
          )}

          {/* Parked Orders List */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Saved Parked Orders ({parkedOrders.length})
            </div>

            {parkedOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-xl bg-slate-50/50">
                <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-2">
                  <SquareParking className="h-8 w-8" />
                </div>
                <p className="font-semibold text-sm text-slate-700">
                  No Parked Orders
                </p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  When you park a cart with items, discounts, or customers, it will be saved here so you can resume it anytime.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-3 pb-2">
                  {parkedOrders.map((order) => {
                    const itemCount = order.cart.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-all shadow-sm flex flex-col gap-3"
                      >
                        {/* Order Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(order.createdAt)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-base text-emerald-700">
                              OMR {order.total.toFixed(3)}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Plate Info */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border text-slate-700">
                            <User className="h-3 w-3 text-blue-600" />
                            {order.currentCustomer?.name || "Walk-in Customer"}
                          </span>
                          {order.carPlateNumber && (
                            <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border text-slate-700">
                              <Car className="h-3 w-3 text-emerald-600" />
                              {order.carPlateNumber}
                            </span>
                          )}
                          {order.appliedDiscount && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-800">
                              <Scissors className="h-3 w-3 text-amber-600" />
                              {order.appliedDiscount.type === "percentage"
                                ? `${order.appliedDiscount.value}% Off`
                                : `OMR ${order.appliedDiscount.value.toFixed(3)} Off`}
                            </span>
                          )}
                        </div>

                        {/* Items Preview */}
                        <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
                          <div className="font-medium text-slate-600 text-[11px] uppercase tracking-wider mb-1">
                            {itemCount} item{itemCount > 1 ? "s" : ""}:
                          </div>
                          <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
                            {order.cart.map((item, idx) => (
                              <div
                                key={item.uniqueId || idx}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="truncate max-w-[280px]">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="font-medium shrink-0 ml-2">
                                  OMR {(item.price * item.quantity).toFixed(3)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Note if available */}
                        {order.note && (
                          <div className="text-xs italic text-slate-500 bg-amber-50/50 border border-amber-100 rounded px-2.5 py-1">
                            Note: {order.note}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 px-2.5"
                            onClick={() => onDeleteOrder(order.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-1.5 px-3 rounded-lg"
                            onClick={() => handleResumeClick(order)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Resume Order
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
