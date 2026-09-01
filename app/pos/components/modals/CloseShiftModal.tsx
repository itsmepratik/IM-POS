"use client";

import { useState } from "react";
import {
  Banknote,
  LogOut,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Clock,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { closeCashShift, type ActiveShiftDetails } from "@/lib/actions/cash-shifts";
import { DenominationBreakdown } from "@/lib/db/schema";
import { calculateDenominationsTotal } from "@/lib/utils/cash-denomination";
import { Numpad } from "../Numpad";

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ActiveShiftDetails | null;
  onShiftClosed: () => void;
}

export function CloseShiftModal({
  isOpen,
  onClose,
  activeShift,
  onShiftClosed,
}: CloseShiftModalProps) {
  const { toast } = useToast();
  const [staffIdInput, setStaffIdInput] = useState("");
  const [validatedStaff, setValidatedStaff] = useState<{ id: string; name: string; staffId: string } | null>(null);
  const [isValidatingStaff, setIsValidatingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Denominations
  const [denominations, setDenominations] = useState<DenominationBreakdown>({
    fiftyNote: 0,
    twentyNote: 0,
    tenNote: 0,
    fiveNote: 0,
    oneNote: 0,
    halfNote: 0,
    hundredBaisa: 0,
    coins: 0,
  });

  const [useDenominations, setUseDenominations] = useState(true);
  const [manualClosingCash, setManualClosingCash] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedCountedTotal = calculateDenominationsTotal(denominations);
  const actualClosingCash = useDenominations ? calculatedCountedTotal : parseFloat(manualClosingCash) || 0;

  const expectedCashInDrawer = activeShift?.currentCashInDrawer || 0;
  const cashDifference = actualClosingCash - expectedCashInDrawer;

  const handleValidateStaff = async () => {
    if (!staffIdInput.trim()) {
      setStaffError("Please enter your staff ID");
      return;
    }

    setIsValidatingStaff(true);
    setStaffError(null);

    try {
      const { validateStaffCodeAction } = await import("@/lib/actions/staff-auth");
      const member = await validateStaffCodeAction(staffIdInput.trim());
      if (member) {
        setValidatedStaff({
          id: member.id,
          name: member.name,
          staffId: member.staffId,
        });
        setStaffError(null);
      } else {
        setValidatedStaff(null);
        setStaffError("Invalid or inactive staff ID. Try again.");
      }
    } catch (err: any) {
      setStaffError("Failed to validate staff ID");
    } finally {
      setIsValidatingStaff(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;

    if (!validatedStaff) {
      toast({
        title: "Staff Verification Required",
        description: "Please enter and verify your Staff ID before closing shift.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await closeCashShift({
        shiftId: activeShift.id,
        closedByStaffId: validatedStaff.id,
        actualClosingCash,
        closingDenominations: useDenominations ? denominations : undefined,
        closingNotes: closingNotes.trim() || undefined,
      });

      if (res.success) {
        toast({
          title: "Shift Closed Successfully",
          description: `Shift closed. Actual cash counted: OMR ${actualClosingCash.toFixed(3)}. POS is now locked.`,
        });
        onClose();
        onShiftClosed();
      } else {
        toast({
          title: "Failed to Close Shift",
          description: res.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to communicate with server.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeShift) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                End Shift & Count Register
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Shop: <span className="font-semibold text-gray-800">{activeShift.shopName}</span> • Opened by {activeShift.openedByStaffName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Shift Summary Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Opening Float</span>
              <p className="text-base font-bold font-mono text-slate-900">
                OMR {Number(activeShift.openingCash || 0).toFixed(3)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cash Sales</span>
              <p className="text-base font-bold font-mono text-emerald-600">
                +OMR {Number(activeShift.calculatedCashSales || 0).toFixed(3)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cash In / Out</span>
              <p className="text-base font-bold font-mono text-slate-700">
                {activeShift.totalCashIn - activeShift.totalCashOut >= 0 ? "+" : ""}
                OMR {(activeShift.totalCashIn - activeShift.totalCashOut).toFixed(3)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Card & Digital</span>
              <p className="text-base font-bold font-mono text-indigo-600">
                OMR {(activeShift.calculatedCardSales + activeShift.calculatedMobileSales).toFixed(3)}
              </p>
            </div>
          </div>

          {/* Expected Drawer Target */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-900 block">Expected System Cash in Drawer:</span>
              <span className="text-xs text-amber-700">Opening Float + Net Cash Sales + Cash In - Cash Out</span>
            </div>
            <span className="text-2xl font-black text-amber-950 font-mono">
              OMR {expectedCashInDrawer.toFixed(3)}
            </span>
          </div>

          {/* Step 1: Staff Verification */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              <span>1. Closing Staff Verification</span>
              {validatedStaff && (
                <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                  <UserCheck className="w-4 h-4" /> Verified: {validatedStaff.name} ({validatedStaff.staffId})
                </span>
              )}
            </Label>

            {!validatedStaff ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Staff ID (e.g. 0001)"
                    value={staffIdInput}
                    onChange={(e) => {
                      setStaffIdInput(e.target.value);
                      setStaffError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleValidateStaff();
                    }}
                    className="text-lg font-mono tracking-wider h-12 rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleValidateStaff}
                    disabled={isValidatingStaff || !staffIdInput.trim()}
                    className="h-12 px-6 rounded-xl font-bold"
                  >
                    {isValidatingStaff ? "Verifying..." : "Verify ID"}
                  </Button>
                </div>
                {staffError && (
                  <p className="text-xs text-red-600 font-medium">{staffError}</p>
                )}
                {/* Touch Numpad for Mobile & Tablets (hidden on PC desktops) */}
                <div className="block lg:hidden">
                  <Numpad
                    value={staffIdInput}
                    onChange={(val) => {
                      setStaffIdInput(val);
                      setStaffError(null);
                    }}
                    onBackspace={() => setStaffIdInput((prev) => prev.slice(0, -1))}
                    onSubmit={handleValidateStaff}
                    className="w-full max-w-xs mx-auto my-2"
                    buttonClassName="h-12 text-lg rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div>
                  <p className="text-sm font-bold text-emerald-900">{validatedStaff.name}</p>
                  <p className="text-xs text-emerald-700 font-mono">Staff ID: {validatedStaff.staffId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setValidatedStaff(null);
                    setStaffIdInput("");
                  }}
                  className="text-xs text-emerald-800 hover:text-emerald-900"
                >
                  Change Staff
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Cash Drawer Count */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700">
                2. Physical Cash Drawer Count
              </Label>
              <button
                type="button"
                onClick={() => setUseDenominations(!useDenominations)}
                className="text-xs text-primary font-medium hover:underline"
              >
                {useDenominations ? "Switch to Simple Amount" : "Switch to Denomination Breakdown"}
              </button>
            </div>

            {useDenominations ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: "50 OMR", key: "fiftyNote", value: 50 },
                  { label: "20 OMR", key: "twentyNote", value: 20 },
                  { label: "10 OMR", key: "tenNote", value: 10 },
                  { label: "5 OMR", key: "fiveNote", value: 5 },
                  { label: "1 OMR", key: "oneNote", value: 1 },
                  { label: "1/2 OMR (500b)", key: "halfNote", value: 0.5 },
                  { label: "100 Baisa", key: "hundredBaisa", value: 0.1 },
                ].map((denom) => (
                  <div key={denom.key} className="bg-white border border-gray-200 rounded-xl p-2.5 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block truncate">{denom.label}</span>
                    <Input
                      type="number"
                      min="0"
                      value={denominations[denom.key as keyof DenominationBreakdown] || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setDenominations((prev) => ({ ...prev, [denom.key]: val }));
                      }}
                      placeholder="0"
                      className="h-9 text-center font-bold font-mono text-sm"
                    />
                  </div>
                ))}
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-500 block truncate">Other Coins (OMR)</span>
                  <Input
                    type="number"
                    step="0.050"
                    min="0"
                    value={denominations.coins || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDenominations((prev) => ({ ...prev, coins: val }));
                    }}
                    placeholder="0.000"
                    className="h-9 text-center font-bold font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Total Counted Cash in Drawer (OMR)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={manualClosingCash}
                  onChange={(e) => setManualClosingCash(e.target.value)}
                  placeholder="0.000"
                  className="h-12 text-xl font-bold font-mono text-center rounded-xl"
                />
              </div>
            )}

            {/* Reconciliation Comparison Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Actual Counted:</span>
                <span className="text-lg font-black text-gray-900 font-mono">
                  OMR {actualClosingCash.toFixed(3)}
                </span>
              </div>

              <div
                className={`rounded-xl p-3 border flex items-center justify-between ${
                  Math.abs(cashDifference) < 0.005
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : cashDifference > 0
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {Math.abs(cashDifference) < 0.005 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : cashDifference > 0 ? (
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-xs font-bold">
                    {Math.abs(cashDifference) < 0.005
                      ? "Perfect Match"
                      : cashDifference > 0
                      ? "Cash Overage"
                      : "Cash Shortage"}
                  </span>
                </div>
                <span className="text-lg font-black font-mono">
                  {cashDifference > 0 ? "+" : ""}
                  OMR {cashDifference.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Closing Notes / Discrepancy Reason (Optional)</Label>
            <Textarea
              placeholder="e.g. End of evening shift. Verified with manager."
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="h-20 rounded-xl text-sm resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-1/3 h-12 rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCloseShift}
              disabled={isSubmitting || !validatedStaff}
              className="w-2/3 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                "Closing Shift..."
              ) : (
                <>
                  <span>End Shift & Lock POS</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
