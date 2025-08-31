"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeinBattery {
  id: string;
  size: string;
  status: "scrap" | "resellable" | "";
  amount: number;
}

export function TradeInDialog({
  open,
  onOpenChange,
  initialAmount = 0,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAmount?: number;
  onApply: (totalAmount: number) => void;
}) {
  const [batteries, setBatteries] = useState<TradeinBattery[]>([]);
  const [entry, setEntry] = useState<{
    size: string;
    status: string;
    amount: number;
  }>({ size: "", status: "", amount: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    size: false,
    status: false,
    amount: false,
  });

  useEffect(() => {
    if (!open) {
      setBatteries([]);
      setEntry({ size: "", status: "", amount: 0 });
      setEditingId(null);
      setErrors({ size: false, status: false, amount: false });
      return;
    }
    if (initialAmount > 0 && batteries.length === 0) {
      setEntry({ size: "", status: "", amount: initialAmount });
    }
  }, [open]);

  const total = useMemo(
    () => batteries.reduce((sum, b) => sum + b.amount, 0),
    [batteries]
  );

  const validate = () => {
    const next = {
      size: !entry.size,
      status: !entry.status,
      amount: entry.amount <= 0,
    };
    setErrors(next);
    return !(next.size || next.status || next.amount);
  };

  const onAdd = () => {
    if (!validate()) return;
    const newBattery: TradeinBattery = {
      id: `battery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      size: entry.size,
      status: entry.status as "scrap" | "resellable",
      amount: entry.amount,
    };
    setBatteries((prev) => [...prev, newBattery]);
    setEntry({ size: "", status: "", amount: 0 });
    setErrors({ size: false, status: false, amount: false });
  };

  const onStartEdit = (id: string) => {
    const b = batteries.find((x) => x.id === id);
    if (!b) return;
    setEntry({ size: b.size, status: b.status, amount: b.amount });
    setEditingId(id);
  };

  const onUpdate = () => {
    if (!validate() || !editingId) return;
    setBatteries((prev) =>
      prev.map((b) =>
        b.id === editingId
          ? {
              ...b,
              size: entry.size,
              status: entry.status as "scrap" | "resellable",
              amount: entry.amount,
            }
          : b
      )
    );
    setEntry({ size: "", status: "", amount: 0 });
    setEditingId(null);
    setErrors({ size: false, status: false, amount: false });
  };

  const onRemove = (id: string) => {
    setBatteries((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEntry({ size: "", status: "", amount: 0 });
      setErrors({ size: false, status: false, amount: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95%] max-w-[600px] p-4 sm:p-5 md:p-6 rounded-xl max-h-[90dvh] flex flex-col overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center text-lg sm:text-xl">
            Battery Trade-In Details
          </DialogTitle>
          <DialogDescription className="text-center">
            Add multiple batteries with their details and trade-in values.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4">
          <div className="flex-shrink-0 space-y-3 border rounded-lg p-3 sm:p-4 bg-muted/30 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ti-size">Battery Size</Label>
                <select
                  id="ti-size"
                  className={`w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${
                    errors.size
                      ? "border-red-500 bg-red-50"
                      : "border-input bg-background"
                  }`}
                  value={entry.size}
                  onChange={(e) => {
                    setEntry((p) => ({ ...p, size: e.target.value }));
                    setErrors((p) => ({ ...p, size: false }));
                  }}
                >
                  <option value="">Select Size</option>
                  <option value="100">100</option>
                  <option value="80">80</option>
                  <option value="55">55</option>
                  <option value="50">50</option>
                  <option value="40L">40L</option>
                  <option value="40S">40S</option>
                </select>
                {errors.size && (
                  <p className="text-xs text-red-500">
                    Please select a battery size
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ti-status">Battery Status</Label>
                <select
                  id="ti-status"
                  className={`w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ${
                    errors.status
                      ? "border-red-500 bg-red-50"
                      : "border-input bg-background"
                  }`}
                  value={entry.status}
                  onChange={(e) => {
                    setEntry((p) => ({ ...p, status: e.target.value }));
                    setErrors((p) => ({ ...p, status: false }));
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="scrap">Scrap</option>
                  <option value="resellable">Resellable</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-red-500">
                    Please select a battery status
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="ti-amount">Amount (OMR)</Label>
                <Input
                  id="ti-amount"
                  type="number"
                  placeholder="e.g. 5.000"
                  min="0"
                  inputMode="decimal"
                  step="0.001"
                  className={errors.amount ? "border-red-500 bg-red-50" : ""}
                  value={entry.amount === 0 ? "" : entry.amount}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setEntry((p) => ({ ...p, amount: v }));
                    setErrors((p) => ({ ...p, amount: false }));
                  }}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500">
                    Please enter a valid amount
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-start sm:justify-end">
                <Button
                  onClick={editingId ? onUpdate : onAdd}
                  className="px-6 w-full sm:w-auto"
                >
                  {editingId ? "Update" : "Add Battery"}
                </Button>
                {editingId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEntry({ size: "", status: "", amount: 0 });
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 rounded-md">
            {batteries.length > 0 ? (
              <div className="h-full flex flex-col">
                <h4 className="text-sm font-medium mb-2 sm:mb-3 flex-shrink-0">
                  Added Batteries ({batteries.length})
                </h4>
                {/* Fixed height scrollable container with responsive heights */}
                <div className="border rounded-lg bg-muted/30 w-full max-w-full">
                  <ScrollArea className="h-[180px] sm:h-[220px] md:h-[240px] px-1 py-2 w-full max-w-full">
                    <div className="space-y-2 sm:space-y-3 pr-2 py-1">
                      <AnimatePresence mode="popLayout">
                        {batteries.map((b) => (
                          <motion.div
                            key={b.id}
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{
                              duration: 0.2,
                              ease: [0.4, 0.0, 0.2, 1],
                            }}
                            layout
                            layoutId={b.id}
                          >
                            <Card className="rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-2 sm:gap-3">
                                  <div className="flex-1 min-w-0">
                                    {/* Mobile: Stack vertically, Desktop: Horizontal */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-x-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-xs sm:text-sm">
                                          Size: {b.size}
                                        </span>
                                        <span className="text-muted-foreground hidden sm:inline">
                                          |
                                        </span>
                                        <span className="font-medium text-xs sm:text-sm">
                                          Status: {b.status}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mt-1 text-sm sm:text-base font-semibold text-primary">
                                      OMR {b.amount.toFixed(3)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onStartEdit(b.id)}
                                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md hover:bg-blue-50 hover:border-blue-200"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => onRemove(b.id)}
                                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md hover:bg-red-50 hover:border-red-200"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[120px] sm:h-[140px] text-muted-foreground border rounded-lg bg-muted/10">
                <div className="text-center">
                  <p className="text-sm">No batteries added yet</p>
                  <p className="text-xs mt-1">
                    Add battery details above to get started
                  </p>
                </div>
              </div>
            )}
          </div>

          {batteries.length > 0 && (
            <div className="flex-shrink-0 border rounded-lg bg-primary/5 border-primary/20 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-sm sm:text-base font-medium text-foreground">
                  Total Trade-In Amount:
                </span>
                <span className="text-lg sm:text-xl font-bold text-primary">
                  OMR {total.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
          <Button
            variant="outline"
            className="sm:flex-1 h-10 sm:h-11"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="sm:flex-1 h-10 sm:h-11"
            disabled={batteries.length === 0}
            onClick={() => {
              onApply(total);
              onOpenChange(false);
            }}
          >
            <span className="hidden sm:inline">
              Apply Trade-In (OMR {total.toFixed(3)})
            </span>
            <span className="sm:hidden">Apply (OMR {total.toFixed(3)})</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
