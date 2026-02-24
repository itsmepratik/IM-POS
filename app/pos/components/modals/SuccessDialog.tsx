"use client";

import {
  Dialog,
  DialogContentWithoutClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { CartItem } from "../../types";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartContainsOnlyBatteries: (cartItems: CartItem[]) => boolean;
  cart: CartItem[];
  onViewReceipt: () => void;
  onClose: () => void;
}

export function SuccessDialog({
  open,
  onOpenChange,
  cartContainsOnlyBatteries,
  cart,
  onViewReceipt,
  onClose,
}: SuccessDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentWithoutClose
        className="w-[90%] max-w-[500px] px-6 pb-6 pt-0 rounded-lg max-h-[90vh] overflow-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4 sticky top-0 bg-background z-10 pt-6">
          <DialogTitle className="text-xl font-semibold text-center">
            {cartContainsOnlyBatteries(cart)
              ? "Bill Generated"
              : "Payment Complete"}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          key={
            cartContainsOnlyBatteries(cart) ? "bill-success" : "payment-success"
          }
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="flex flex-col items-center justify-center py-6"
        >
          {!cartContainsOnlyBatteries(cart) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="rounded-full bg-green-100 p-3 mb-4"
            >
              <Check className="w-8 h-8 text-green-600" />
            </motion.div>
          )}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg font-medium text-green-600 mb-4"
          >
            {cartContainsOnlyBatteries(cart)
              ? "Bill Ready for Printing"
              : "Order Successfully Processed!"}
          </motion.p>

          <div className="w-full flex flex-row gap-4 mt-4">
            <Button
              onClick={onViewReceipt}
              className="flex-1"
              variant="chonky-secondary"
            >
              View Receipt
            </Button>
            <Button
              variant="chonky-secondary"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </DialogContentWithoutClose>
    </Dialog>
  );
}
