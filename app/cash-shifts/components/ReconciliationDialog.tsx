"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Printer,
  UserCheck,
  Calendar,
  Clock,
  Banknote,
  Receipt,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { reconcileCashShift } from "@/lib/actions/cash-shifts";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/lib/contexts/UserContext";

interface ReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shift: any | null;
  onReconciliationSaved: () => void;
}

export function ReconciliationDialog({
  isOpen,
  onClose,
  shift,
  onReconciliationSaved,
}: ReconciliationDialogProps) {
  const { toast } = useToast();
  const { currentUser, isAdmin } = useUser();
  const [adminNotes, setAdminNotes] = useState("");
  const [staffIdInput, setStaffIdInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!shift) return null;

  const openingCash = parseFloat(shift.openingCash) || 0;
  const expectedClosing = parseFloat(shift.expectedClosingCash) || 0;
  const actualClosing = parseFloat(shift.actualClosingCash) || 0;
  const difference = parseFloat(shift.cashDifference) || 0;
  const totalCashSales = parseFloat(shift.totalCashSales) || 0;
  const totalCardSales = parseFloat(shift.totalCardSales) || 0;
  const totalMobileSales = parseFloat(shift.totalMobileSales) || 0;
  const totalCreditSales = parseFloat(shift.totalCreditSales) || 0;
  const totalRefunds = parseFloat(shift.totalRefunds) || 0;

  const isBalanced = Math.abs(difference) < 0.005;
  const isOverage = difference > 0.005;
  const isShortage = difference < -0.005;

  const handleReconcile = async (status: "approved" | "balanced" | "overage" | "shortage") => {
    if (!staffIdInput.trim()) {
      toast({
        title: "Admin Staff ID Required",
        description: "Please enter your admin Staff ID to sign off on this shift.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { validateStaffCodeAction } = await import("@/lib/actions/staff-auth");
      const adminMember = await validateStaffCodeAction(staffIdInput.trim());
      if (!adminMember) {
        toast({
          title: "Invalid Staff ID",
          description: "Staff member not found or inactive.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const res = await reconcileCashShift({
        shiftId: shift.id,
        reconciledByStaffId: adminMember.id,
        reconciliationNotes: adminNotes.trim() || undefined,
        reconciliationStatus: status,
      });

      if (res.success) {
        toast({
          title: "Shift Reconciled",
          description: "Reconciliation record and sign-off saved successfully.",
        });
        onClose();
        onReconciliationSaved();
      } else {
        toast({
          title: "Reconciliation Failed",
          description: res.error || "Could not save reconciliation.",
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

  const handlePrintZReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shift Z-Report - ${shift.id.substring(0, 8)}</title>
          <style>
            body { font-family: monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
            h2, h3, p { text-align: center; margin: 4px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .bold { font-weight: bold; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>HNS AUTOMOTIVE</h2>
          <h3>SHIFT AUDIT REPORT (Z-REPORT)</h3>
          <p>${shift.shopName} - ${shift.locationName}</p>
          <div class="divider"></div>
          <div class="row"><span>Shift ID:</span><span>${shift.id.substring(0, 8)}</span></div>
          <div class="row"><span>Cashier:</span><span>${shift.openedByName}</span></div>
          <div class="row"><span>Opened:</span><span>${shift.startTime ? format(new Date(shift.startTime), "dd/MM/yyyy HH:mm") : "-"}</span></div>
          <div class="row"><span>Closed:</span><span>${shift.endTime ? format(new Date(shift.endTime), "dd/MM/yyyy HH:mm") : "-"}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Opening Cash:</span><span class="bold">OMR ${openingCash.toFixed(3)}</span></div>
          <div class="row"><span>Cash Sales:</span><span>OMR ${totalCashSales.toFixed(3)}</span></div>
          <div class="row"><span>Card Sales:</span><span>OMR ${totalCardSales.toFixed(3)}</span></div>
          <div class="row"><span>Mobile / Digital:</span><span>OMR ${totalMobileSales.toFixed(3)}</span></div>
          <div class="row"><span>Credit Sales:</span><span>OMR ${totalCreditSales.toFixed(3)}</span></div>
          <div class="row"><span>Refunds Total:</span><span>-OMR ${totalRefunds.toFixed(3)}</span></div>
          <div class="row"><span>Transactions:</span><span>${shift.totalTransactions || 0}</span></div>
          <div class="divider"></div>
          <div class="row bold"><span>Expected Drawer:</span><span>OMR ${expectedClosing.toFixed(3)}</span></div>
          <div class="row bold"><span>Actual Counted:</span><span>OMR ${actualClosing.toFixed(3)}</span></div>
          <div class="row bold"><span>Variance:</span><span>${difference > 0 ? "+" : ""}OMR ${difference.toFixed(3)}</span></div>
          <div class="divider"></div>
          <p>Status: ${shift.reconciliationStatus?.toUpperCase() || "PENDING"}</p>
          ${shift.closingNotes ? `<p>Cashier Notes: ${shift.closingNotes}</p>` : ""}
          <p style="margin-top: 20px;">Manager Signature: ___________________</p>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Shift Drawer Reconciliation
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Shop: <span className="font-semibold text-gray-800">{shift.shopName}</span> • Opened by {shift.openedByName} ({shift.openedByCode})
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintZReport}
              className="gap-1.5 rounded-xl text-xs font-semibold h-9"
            >
              <Printer className="w-4 h-4" />
              Print Z-Report
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Shift Time and Meta Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs">
            <div>
              <span className="text-gray-500 block">Shift Started</span>
              <span className="font-semibold text-gray-800">
                {shift.startTime ? format(new Date(shift.startTime), "dd MMM, HH:mm") : "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Shift Ended</span>
              <span className="font-semibold text-gray-800">
                {shift.endTime ? format(new Date(shift.endTime), "dd MMM, HH:mm") : "Active"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Total Transactions</span>
              <span className="font-bold text-gray-900 font-mono">
                {shift.totalTransactions || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Status</span>
              <Badge
                variant="outline"
                className={
                  shift.status === "open"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : shift.status === "reconciled"
                    ? "bg-purple-50 text-purple-700 border-purple-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }
              >
                {shift.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Cash Variance Highlight Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500 block">Expected Drawer Cash</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                OMR {expectedClosing.toFixed(3)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Float + Net Cash Sales + In/Out
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500 block">Actual Counted Cash</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                OMR {actualClosing.toFixed(3)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Counted by cashier at shift end
              </span>
            </div>

            <div
              className={`rounded-2xl p-4 border ${
                isBalanced
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : isOverage
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {isBalanced ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isOverage ? (
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs font-bold">
                  {isBalanced ? "Balanced (0 Variance)" : isOverage ? "Cash Overage" : "Cash Shortage"}
                </span>
              </div>
              <span className="text-xl font-black font-mono block">
                {difference > 0 ? "+" : ""}
                OMR {difference.toFixed(3)}
              </span>
              <span className="text-[11px] opacity-80 mt-1 block">
                {isBalanced ? "All counts match system expected" : "Requires manager sign-off note"}
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Shift Revenue & Collection Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Cash Sales</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  OMR {totalCashSales.toFixed(3)}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Card Sales</span>
                <span className="text-base font-bold font-mono text-indigo-700">
                  OMR {totalCardSales.toFixed(3)}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Mobile / Online</span>
                <span className="text-base font-bold font-mono text-blue-700">
                  OMR {totalMobileSales.toFixed(3)}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 block">Credit / Outstanding</span>
                <span className="text-base font-bold font-mono text-purple-700">
                  OMR {totalCreditSales.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Cashier Closing Notes */}
          {shift.closingNotes && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1 text-xs">
              <span className="font-bold text-amber-900">Cashier Closing Remarks:</span>
              <p className="text-amber-800">{shift.closingNotes}</p>
            </div>
          )}

          {/* Admin Sign-Off Form */}
          {shift.status !== "reconciled" ? (
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold">Administrator Reconciliation Sign-off</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Admin Staff ID</Label>
                  <Input
                    placeholder="Enter Admin Staff ID (e.g. 0001)"
                    value={staffIdInput}
                    onChange={(e) => setStaffIdInput(e.target.value)}
                    className="h-11 bg-slate-800 border-slate-700 text-white rounded-xl font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Reconciliation Notes / Auditing Remarks</Label>
                  <Input
                    placeholder="e.g. Shift drawer verified and approved"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="h-11 bg-slate-800 border-slate-700 text-white rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => handleReconcile(isBalanced ? "balanced" : isOverage ? "overage" : "shortage")}
                  disabled={isSubmitting || !staffIdInput}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 h-11 rounded-xl"
                >
                  {isSubmitting ? "Reconciling..." : "Approve & Reconcile Shift"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>
                  Reconciled on {shift.reconciledAt ? format(new Date(shift.reconciledAt), "dd MMM yyyy, HH:mm") : "-"}
                </span>
              </div>
              {shift.reconciliationNotes && (
                <span className="text-emerald-700 italic">Notes: {shift.reconciliationNotes}</span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
