"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Trash2, Search, Wrench, UserPlus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { Service } from "@/lib/db/schema";
import type { LaborSplit } from "../../types";
import type { StaffMember } from "@/lib/hooks/useStaffIDs";

interface LaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (data: {
    name: string;
    price: number;
    serviceId?: string;
    description?: string;
    splits?: LaborSplit[];
  }) => void;
  services?: Service[];
  staff?: StaffMember[];
}

export function LaborDialog({
  open,
  onOpenChange,
  onAddToCart,
  services = [],
  staff = [],
}: LaborDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [splits, setSplits] = useState<LaborSplit[]>([]);

  // Filter services based on search
  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nameAr && s.nameAr.includes(searchQuery)),
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedService(null);
      setCustomName("");
      setAmount(0);
      setDescription("");
      setSplits([]);
    }
  }, [open]);

  // Set default amount when service is selected
  useEffect(() => {
    if (selectedService?.defaultPrice) {
      setAmount(Number(selectedService.defaultPrice));
    }
  }, [selectedService]);

  const handleSelectService = useCallback((service: Service) => {
    setSelectedService(service);
    setCustomName(service.name);
    setSearchQuery("");
    if (service.defaultPrice) {
      setAmount(Number(service.defaultPrice));
    }
  }, []);

  const handleAddSplit = useCallback(() => {
    setSplits((prev) => [
      ...prev,
      {
        splitType: "technician_share",
        amount: 0,
        staffName: "",
      },
    ]);
  }, []);

  const handleRemoveSplit = useCallback((index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateSplit = useCallback(
    (index: number, field: keyof LaborSplit, value: string | number) => {
      setSplits((prev) =>
        prev.map((split, i) =>
          i === index ? { ...split, [field]: value } : split,
        ),
      );
    },
    [],
  );

  const handleAdd = useCallback(() => {
    const serviceName = selectedService?.name || customName;
    if (!serviceName || amount <= 0) return;

    // Validate splits sum
    const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
    if (splits.length > 0 && totalSplitAmount > amount) {
      return; // Splits exceed total amount
    }

    onAddToCart({
      name: serviceName,
      price: amount,
      serviceId: selectedService?.id,
      description,
      splits: splits.length > 0 ? splits : undefined,
    });
  }, [
    selectedService,
    customName,
    amount,
    description,
    splits,
    onAddToCart,
  ]);

  const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const splitRemaining = amount - totalSplitAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-[600px] p-6 rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Wrench className="h-5 w-5" />
            Add Service / Labor
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            Select from catalog or enter a custom service
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Service Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services or type a custom service name below..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) setSelectedService(null);
              }}
              className="pl-9"
            />
          </div>

          {/* Service Catalog - always show when no service selected */}
          {!selectedService && (
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredServices.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? "No services match your search - enter details below"
                    : "No services in catalog yet - enter a custom service below"}
                </div>
              ) : (
                filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between text-sm"
                    onClick={() => handleSelectService(service)}
                  >
                    <div>
                      <span className="font-medium">{service.name}</span>
                      {service.nameAr && (
                        <span className="text-muted-foreground ml-2">
                          {service.nameAr}
                        </span>
                      )}
                    </div>
                    {service.defaultPrice && (
                      <span className="text-muted-foreground">
                        {Number(service.defaultPrice).toFixed(3)} OMR
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Service Badge */}
          {selectedService && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedService.name}
              </span>
              {selectedService.category && (
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                  {selectedService.category}
                </span>
              )}
              <button
                type="button"
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedService(null);
                  setCustomName("");
                }}
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Service Name (always editable) */}
          <div>
            <Label htmlFor="service-name">Service Name</Label>
            <Input
              id="service-name"
              placeholder="e.g. Brake Disc Repair, Axle Service, Oil Change..."
              value={selectedService ? selectedService.name : customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setSelectedService(null);
              }}
            />
          </div>

          {/* Amount */}
          <div>
            <Label>Amount (OMR)</Label>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() =>
                  setAmount(Math.max(0, Math.round((amount - 0.5) * 10) / 10))
                }
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                inputMode="decimal"
                className="w-28 text-center text-lg font-medium h-10"
                value={amount || ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setAmount(isNaN(value) ? 0 : value);
                }}
                step="0.5"
                min="0"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() =>
                  setAmount(Math.round((amount + 0.5) * 10) / 10)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Quick Select */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[0.5, 1, 2, 3].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  className="text-sm"
                  onClick={() => setAmount(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="service-desc">Description (optional)</Label>
            <Textarea
              id="service-desc"
              placeholder="Additional notes about this service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Labor Splits */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                Splits
                {splits.length > 0 && (
                  <span className="text-muted-foreground ml-2">
                    ({totalSplitAmount.toFixed(3)} / {amount.toFixed(3)} OMR)
                  </span>
                )}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSplit}
                className="h-7 text-xs"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add Split
              </Button>
            </div>

            {splits.length > 0 && (
              <div className="space-y-2">
                {splits.map((split, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                  >
                    <Select
                      value={split.splitType}
                      onValueChange={(val) =>
                        handleUpdateSplit(index, "splitType", val)
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technician_share">
                          Technician
                        </SelectItem>
                        <SelectItem value="parts_portion">
                          Parts Portion
                        </SelectItem>
                        <SelectItem value="labor_portion">
                          Labor Portion
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {split.splitType === "technician_share" && (
                      <Select
                        value={split.staffId || ""}
                        onValueChange={(val) => {
                          const selectedStaff = staff.find(
                            (s) => s.uuid === val,
                          );
                          handleUpdateSplit(index, "staffId", val);
                          handleUpdateSplit(
                            index,
                            "staffName",
                            selectedStaff?.name || "",
                          );
                        }}
                      >
                        <SelectTrigger className="flex-1 h-8 text-xs">
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff
                            .filter((s) => s.is_active)
                            .map((s) => (
                              <SelectItem key={s.uuid} value={s.uuid || ""}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Input
                      type="number"
                      inputMode="decimal"
                      className="w-20 h-8 text-xs"
                      value={split.amount || ""}
                      onChange={(e) =>
                        handleUpdateSplit(
                          index,
                          "amount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      step="0.1"
                      min="0"
                      placeholder="Amt"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveSplit(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {splitRemaining > 0.001 && (
                  <p className="text-xs text-muted-foreground text-right">
                    Remaining: {splitRemaining.toFixed(3)} OMR
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1 h-12 text-base"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-12 text-base"
            variant="chonky"
            onClick={handleAdd}
            disabled={amount <= 0 || (!selectedService && !customName)}
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
