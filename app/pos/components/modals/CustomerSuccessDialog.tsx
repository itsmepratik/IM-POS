"use client";

import {
  Dialog,
  DialogContentWithoutClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface CustomerSuccessDialogProps {
  open: boolean;
}

export function CustomerSuccessDialog({ open }: CustomerSuccessDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContentWithoutClose
        className="w-[90%] max-w-[400px] px-6 pb-6 pt-0 rounded-lg max-h-[90vh] overflow-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            <span className="sr-only">Customer Added Successfully</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center min-h-[180px] py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="rounded-full bg-green-100 p-3 mb-4"
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg font-semibold text-green-600 text-center"
          >
            Customer Added Successfully
          </motion.p>
        </div>
      </DialogContentWithoutClose>
    </Dialog>
  );
}
