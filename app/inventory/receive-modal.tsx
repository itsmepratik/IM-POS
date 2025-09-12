"use client";

import { useState } from "react";
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
import { useItems } from "./items-context";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReceiveModal({
  open,
  onOpenChange,
}: ReceiveModalProps) {
  const { items, addBatch } = useItems();
  const [formData, setFormData] = useState({
    itemId: "",
    quantity: "1",
    costPrice: "",
    purchaseDate: new Date(),
  });
  const [formError, setFormError] = useState("");

  const filteredItems = items.filter((item) => item.name);

  const handleReceive = async () => {
    if (!formData.itemId) {
      setFormError("Please select an item");
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setFormError("Please enter a valid quantity");
      return;
    }

    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
      setFormError("Please enter a valid cost price");
      return;
    }

    try {
      // Add batch to the selected item
      const success = await addBatch(formData.itemId, {
        purchase_date: format(formData.purchaseDate, "yyyy-MM-dd"),
        cost_price: parseFloat(formData.costPrice),
        initial_quantity: parseInt(formData.quantity),
        current_quantity: parseInt(formData.quantity),
        supplier_id: null,
        expiration_date: null,
      });

      if (success) {
        // Show success message
        const itemName = items.find(
          (item) => item.id === formData.itemId
        )?.name;
        toast({
          title: "Inventory received",
          description: `${formData.quantity} units of ${itemName} have been added to inventory.`,
        });

        // Reset form
        setFormData({
          itemId: "",
          quantity: "1",
          costPrice: "",
          purchaseDate: new Date(),
        });
        setFormError("");

        // Close modal
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error receiving inventory:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setFormError(`Failed to receive inventory: ${errorMessage}`);
      toast({
        title: "Error receiving inventory",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive Inventory</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            <Select
              value={formData.itemId}
              onValueChange={(value) =>
                setFormData({ ...formData, itemId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} {item.brand && `(${item.brand})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (OMR)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.purchaseDate ? (
                    format(formData.purchaseDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.purchaseDate}
                  onSelect={(date) =>
                    setFormData({
                      ...formData,
                      purchaseDate: date || new Date(),
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReceive}>Receive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
