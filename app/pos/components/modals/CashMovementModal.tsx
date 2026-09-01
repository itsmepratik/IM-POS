"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { addCashMovement } from "@/lib/actions/cash-shifts";

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
  onSuccess: () => void;
}

export function CashMovementModal({
  isOpen,
  onClose,
  shiftId,
  onSuccess,
}: CashMovementModalProps) {
  const { toast } = useToast();
  const [staffIdInput, setStaffIdInput] = useState("");
  const [type, setType] = useState<"CASH_IN" | "CASH_OUT" | "DROP" | "PAY_IN" | "PAY_OUT">("DROP");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this cash drawer movement.",
        variant: "destructive",
      });
      return;
    }

    if (!staffIdInput.trim()) {
      toast({
        title: "Staff ID Required",
        description: "Please enter your staff ID for audit trail.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { validateStaffCodeAction } = await import("@/lib/actions/staff-auth");
      const staffMember = await validateStaffCodeAction(staffIdInput.trim());
      if (!staffMember) {
        toast({
          title: "Invalid Staff ID",
          description: "Staff member not found or inactive.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const res = await addCashMovement({
        shiftId,
        staffId: staffMember.id,
        type,
        amount: numAmount,
        reason: reason.trim(),
      });

      if (res.success) {
        toast({
          title: "Cash Movement Recorded",
          description: `Successfully logged ${type.replace("_", " ")} of OMR ${numAmount.toFixed(3)}.`,
        });
        setAmount("");
        setReason("");
        setStaffIdInput("");
        onClose();
        onSuccess();
      } else {
        toast({
          title: "Failed",
          description: res.error || "Could not log movement.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to record cash movement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-amber-600" />
            Cash Drawer Movement
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Log safe drops, petty cash payouts, or float additions during the active shift.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Movement Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("DROP")}
              className={`p-3 rounded-xl border text-left transition-all ${
                type === "DROP" || type === "CASH_OUT" || type === "PAY_OUT"
                  ? "border-red-500 bg-red-50/70 text-red-950 font-bold"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs text-red-600 mb-1">
                <ArrowDownRight className="w-4 h-4" />
                <span>Cash Out / Safe Drop</span>
              </div>
              <span className="text-xs font-normal text-gray-600 block">Remove cash from drawer</span>
            </button>

            <button
              type="button"
              onClick={() => setType("CASH_IN")}
              className={`p-3 rounded-xl border text-left transition-all ${
                type === "CASH_IN" || type === "PAY_IN"
                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 mb-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>Cash In / Float In</span>
              </div>
              <span className="text-xs font-normal text-gray-600 block">Add cash to drawer</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Amount (OMR)</Label>
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder="0.000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 text-lg font-bold font-mono text-center rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Reason / Description</Label>
            <Input
              placeholder="e.g. Mid-day safe drop, shop expenses, float top-up"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Staff ID</Label>
            <Input
              placeholder="Enter your staff ID"
              value={staffIdInput}
              onChange={(e) => setStaffIdInput(e.target.value)}
              className="h-11 rounded-xl font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-1/3 h-11 rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || !reason || !staffIdInput}
              className="w-2/3 h-11 font-bold rounded-xl"
            >
              {isSubmitting ? "Recording..." : "Save Movement"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
