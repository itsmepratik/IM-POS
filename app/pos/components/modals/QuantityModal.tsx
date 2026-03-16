"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Numpad } from "../Numpad";

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quantity: number) => void;
  currentQuantity: number;
  itemName: string;
}

export function QuantityModal({
  isOpen,
  onClose,
  onSave,
  currentQuantity,
  itemName,
}: QuantityModalProps) {
  const [value, setValue] = useState(currentQuantity.toString());

  useEffect(() => {
    if (isOpen) {
      setValue(currentQuantity.toString());
    }
  }, [isOpen, currentQuantity]);

  const handleSave = () => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty > 0) {
      onSave(qty);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="quantity-modal-description"
      >
        <DialogHeader>
          <DialogTitle>Edit Quantity</DialogTitle>
          <DialogDescription id="quantity-modal-description">
            Enter new quantity for {itemName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex flex-col items-center w-full px-2">
          <div className="text-5xl font-bold mb-6 min-h-[60px] border-b-4 border-primary pb-2 text-center w-48">
            {value || "0"}
          </div>
          <Numpad
            value={value}
            onChange={setValue}
            onBackspace={() => setValue(value.slice(0, -1))}
            onSubmit={handleSave}
            className="w-full gap-3 mt-2"
            buttonClassName="p-6 text-2xl sm:p-8 sm:text-3xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
