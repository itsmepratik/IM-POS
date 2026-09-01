"use client";

import { useState } from "react";
import { Lock, Unlock, ArrowRight, ShieldAlert, DollarSign, UserCheck, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { openCashShift } from "@/lib/actions/cash-shifts";
import { DenominationBreakdown } from "@/lib/db/schema";
import { calculateDenominationsTotal } from "@/lib/utils/cash-denomination";
import { Numpad } from "../Numpad";

interface POSShiftLockOverlayProps {
  shopName?: string;
  shopId?: string;
  locationId?: string;
  onShiftOpened: (shift: any) => void;
}

export function POSShiftLockOverlay({
  shopName = "Current Register",
  shopId,
  locationId,
  onShiftOpened,
}: POSShiftLockOverlayProps) {
  const { toast } = useToast();
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
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

  const [openingNotes, setOpeningNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual total or auto-calculated
  const calculatedTotal = calculateDenominationsTotal(denominations);
  const [manualOpeningCash, setManualOpeningCash] = useState<string>("0.000");
  const [useDenominations, setUseDenominations] = useState(false);

  const effectiveTotal = useDenominations ? calculatedTotal : parseFloat(manualOpeningCash) || 0;

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

  const handleOpenShift = async () => {
    if (!validatedStaff) {
      toast({
        title: "Staff Required",
        description: "Please enter and verify your Staff ID first.",
        variant: "destructive",
      });
      return;
    }

    if (!shopId || !locationId) {
      toast({
        title: "Shop Not Selected",
        description: "Please ensure a valid branch is selected.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await openCashShift({
        shopId,
        locationId,
        openedByStaffId: validatedStaff.id,
        openingCash: effectiveTotal,
        openingDenominations: useDenominations ? denominations : undefined,
        openingNotes: openingNotes.trim() || undefined,
      });

      if (res.success && res.shift) {
        toast({
          title: "Shift Started Successfully",
          description: `Cash shift opened by ${validatedStaff.name} with OMR ${effectiveTotal.toFixed(3)}.`,
        });
        setIsOpenShiftModalOpen(false);
        onShiftOpened(res.shift);
      } else {
        toast({
          title: "Failed to Open Shift",
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

  return (
    <>
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Cash Register Locked
            </h2>
            <p className="text-sm text-slate-400">
              There is no active cash shift for <span className="font-semibold text-amber-400">{shopName}</span>. 
              The point of sale cannot be operated until a cashier opens a new shift and counts the opening drawer.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-6 rounded-2xl text-base shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Unlock className="w-5 h-5" />
              <span>Open Cash Shift & Unlock POS</span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Strict Audit Security Active</span>
          </div>
        </div>
      </div>

      {/* Open Shift Modal */}
      <Dialog open={isOpenShiftModalOpen} onOpenChange={setIsOpenShiftModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Open Cash Shift
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Register: <span className="font-medium text-gray-800">{shopName}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Step 1: Staff Identification */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>1. Cashier Identification</span>
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

            {/* Step 2: Opening Drawer Float / Denominations */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">
                  2. Opening Drawer Cash Float
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
                <div className="space-y-3">
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
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Total Opening Cash (OMR)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={manualOpeningCash}
                    onChange={(e) => setManualOpeningCash(e.target.value)}
                    placeholder="0.000"
                    className="h-12 text-xl font-bold font-mono text-center rounded-xl"
                  />
                </div>
              )}

              {/* Total Float Banner */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <span className="text-sm font-semibold text-amber-900">Total Opening Float:</span>
                <span className="text-xl font-black text-amber-950 font-mono">
                  OMR {effectiveTotal.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Opening Notes (Optional)</Label>
              <Input
                placeholder="e.g. Standard morning shift float counted and verified"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="w-1/3 h-12 rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOpenShift}
                disabled={isSubmitting || !validatedStaff}
                className="w-2/3 h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-base flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Starting Shift..."
                ) : (
                  <>
                    <span>Confirm & Unlock POS</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
