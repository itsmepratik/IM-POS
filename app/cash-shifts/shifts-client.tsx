"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Banknote,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileCheck,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
} from "lucide-react";
import { format } from "date-fns";
import { getCashShiftsHistory, getActiveShift, getCashShiftFullDetails } from "@/lib/actions/cash-shifts";
import { ReconciliationDialog } from "./components/ReconciliationDialog";
import { CloseShiftModal } from "@/app/pos/components/modals/CloseShiftModal";
import { POSShiftLockOverlay } from "@/app/pos/components/modals/POSShiftLockOverlay";
import { CashMovementModal } from "@/app/pos/components/modals/CashMovementModal";
import { useToast } from "@/components/ui/use-toast";

interface CashShiftsClientProps {
  initialShops: any[];
  initialActiveShift: any;
  initialHistory: any[];
  initialBranchId?: string;
}

export function CashShiftsClient({
  initialShops,
  initialActiveShift,
  initialHistory,
  initialBranchId,
}: CashShiftsClientProps) {
  const { toast } = useToast();
  const [selectedShopId, setSelectedShopId] = useState<string>(initialBranchId || "all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeShift, setActiveShift] = useState<any>(initialActiveShift);
  const [history, setHistory] = useState<any[]>(initialHistory);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [selectedShiftForReconcile, setSelectedShiftForReconcile] = useState<any | null>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);

  const fetchShifts = async (shopIdOverride?: string, statusOverride?: string) => {
    const shop = shopIdOverride !== undefined ? shopIdOverride : selectedShopId;
    const stat = statusOverride !== undefined ? statusOverride : selectedStatus;

    setIsLoading(true);
    try {
      const historyData = await getCashShiftsHistory({
        shopId: shop === "all" ? undefined : shop,
        status: stat === "all" ? undefined : (stat as any),
      });
      setHistory(historyData);

      if (shop !== "all") {
        const active = await getActiveShift(shop);
        setActiveShift(active);
      } else {
        // When All Branches is selected, check if there's any active shift across all shops
        let foundActive: any = null;
        for (const s of initialShops) {
          const act = await getActiveShift(s.id);
          if (act) {
            foundActive = act;
            break;
          }
        }
        setActiveShift(foundActive);
      }
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
      toast({
        title: "Error",
        description: "Failed to load shift records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReconcile = async (shift: any) => {
    try {
      const fullDetails = await getCashShiftFullDetails(shift.id);
      setSelectedShiftForReconcile(fullDetails || shift);
    } catch {
      setSelectedShiftForReconcile(shift);
    }
  };

  // Calculations for KPI Summary
  const totalShiftsCount = history.length;
  const unreconciledCount = history.filter((s) => s.status === "closed").length;
  const totalDifferenceSum = history.reduce((sum, s) => sum + (parseFloat(s.cashDifference) || 0), 0);
  const totalCashCollected = history.reduce((sum, s) => sum + (parseFloat(s.totalCashSales) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 sm:p-2">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2.5">
            <Banknote className="w-8 h-8 text-amber-500" />
            Cash Shift Management & Reconciliation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor physical cash drawer counts, staff shift handovers, and manager reconciliation audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={selectedShopId}
            onValueChange={(val) => {
              setSelectedShopId(val);
              fetchShifts(val, selectedStatus);
            }}
          >
            <SelectTrigger className="w-[180px] h-10 rounded-xl font-medium bg-white">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {initialShops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val);
              fetchShifts(selectedShopId, val);
            }}
          >
            <SelectTrigger className="w-[140px] h-10 rounded-xl font-medium bg-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open Shifts</SelectItem>
              <SelectItem value="closed">Closed Shifts</SelectItem>
              <SelectItem value="reconciled">Reconciled</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchShifts()}
            disabled={isLoading}
            className="h-10 w-10 rounded-xl"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Shift Status
            </CardDescription>
            <CardTitle className="text-xl font-black">
              {activeShift ? (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Open
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  No Active Shift
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            {activeShift ? `Opened by ${activeShift.openedByStaffName}` : "POS register is locked"}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pending Reconciliation
            </CardDescription>
            <CardTitle className="text-xl font-black text-amber-700">
              {unreconciledCount} Shifts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            Awaiting administrator review & sign-off
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Net Variance
            </CardDescription>
            <CardTitle
              className={`text-xl font-black font-mono ${
                Math.abs(totalDifferenceSum) < 0.005
                  ? "text-emerald-600"
                  : totalDifferenceSum > 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {totalDifferenceSum > 0 ? "+" : ""}
              OMR {totalDifferenceSum.toFixed(3)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            Cumulative discrepancy over listed shifts
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Cash Collected
            </CardDescription>
            <CardTitle className="text-xl font-black font-mono text-gray-900">
              OMR {totalCashCollected.toFixed(3)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            Across {totalShiftsCount} recorded shifts
          </CardContent>
        </Card>
      </div>

      {/* Live Active Shift Banner (if branch selected and shift is active) */}
      {activeShift && (
        <Card className="rounded-3xl border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-600">
                  LIVE REGISTER SHIFT
                </Badge>
                <span className="text-xs font-semibold text-gray-500">
                  Started {activeShift.startTime ? format(new Date(activeShift.startTime), "HH:mm, dd MMM") : ""}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {activeShift.shopName} — Cashier: {activeShift.openedByStaffName} ({activeShift.openedByStaffCode})
              </h3>
              <p className="text-xs text-gray-600">
                Opening Float: <span className="font-mono font-bold">OMR {Number(activeShift.openingCash).toFixed(3)}</span> • 
                Cash Sales: <span className="font-mono font-bold text-emerald-700">+OMR {activeShift.calculatedCashSales.toFixed(3)}</span> • 
                Transactions: <span className="font-bold">{activeShift.calculatedTransactionCount}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="bg-white border border-amber-200 rounded-2xl px-4 py-2.5 shadow-sm text-right">
                <span className="text-[11px] font-semibold text-gray-500 block">Current Drawer Balance</span>
                <span className="text-2xl font-black text-amber-950 font-mono">
                  OMR {activeShift.currentCashInDrawer.toFixed(3)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCashMovementModalOpen(true)}
                  className="rounded-xl font-semibold border-amber-300 hover:bg-amber-100/50"
                >
                  <Banknote className="w-4 h-4 mr-1.5 text-amber-600" />
                  Cash Drop / In
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsCloseModalOpen(true)}
                  className="rounded-xl font-bold"
                >
                  End Shift & Count
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Shifts History Table */}
      <Card className="rounded-3xl border-gray-200 bg-white overflow-hidden shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Shift Log & Reconciliation Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Itemized register sessions with opening float, closing actuals, variances, and approvals.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Shift & Branch</th>
                  <th className="py-3.5 px-4">Cashier</th>
                  <th className="py-3.5 px-4">Time Window</th>
                  <th className="py-3.5 px-4 text-right">Opening Float</th>
                  <th className="py-3.5 px-4 text-right">Cash Sales</th>
                  <th className="py-3.5 px-4 text-right">Counted Cash</th>
                  <th className="py-3.5 px-4 text-right">Variance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      No shift records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  history.map((shift) => {
                    const diff = parseFloat(shift.cashDifference) || 0;
                    const isBalanced = Math.abs(diff) < 0.005;
                    const isOverage = diff > 0.005;

                    return (
                      <tr key={shift.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          <div className="font-bold">{shift.shopName}</div>
                          <span className="text-[11px] text-gray-500 font-mono">
                            #{shift.id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-800">{shift.openedByName}</div>
                          <span className="text-[11px] text-gray-500 font-mono">{shift.openedByCode}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>{shift.startTime ? format(new Date(shift.startTime), "dd MMM, HH:mm") : "-"}</div>
                          <span className="text-[11px] text-gray-500">
                            {shift.endTime ? format(new Date(shift.endTime), "HH:mm") : "Open Now"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          OMR {Number(shift.openingCash || 0).toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                          OMR {Number(shift.totalCashSales || 0).toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {shift.actualClosingCash !== null && shift.actualClosingCash !== undefined
                            ? `OMR ${Number(shift.actualClosingCash).toFixed(3)}`
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black">
                          {shift.cashDifference !== null && shift.cashDifference !== undefined ? (
                            <span
                              className={
                                isBalanced
                                  ? "text-emerald-600"
                                  : isOverage
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }
                            >
                              {diff > 0 ? "+" : ""}
                              {diff.toFixed(3)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={
                              shift.status === "open"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
                                : shift.status === "reconciled"
                                ? "bg-purple-50 text-purple-700 border-purple-300 font-semibold"
                                : "bg-amber-50 text-amber-700 border-amber-300 font-semibold"
                            }
                          >
                            {shift.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReconcile(shift)}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1 text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {shift.status === "closed" ? "Reconcile" : "Details"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Dialog Modal */}
      {selectedShiftForReconcile && (
        <ReconciliationDialog
          isOpen={!!selectedShiftForReconcile}
          onClose={() => setSelectedShiftForReconcile(null)}
          shift={selectedShiftForReconcile}
          onReconciliationSaved={() => {
            fetchShifts();
          }}
        />
      )}

      {/* Close Shift Modal */}
      <CloseShiftModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        activeShift={activeShift}
        onShiftClosed={() => {
          setActiveShift(null);
          fetchShifts();
        }}
      />

      {/* Cash Drawer Movement Modal */}
      {activeShift && (
        <CashMovementModal
          isOpen={isCashMovementModalOpen}
          onClose={() => setIsCashMovementModalOpen(false)}
          shiftId={activeShift.id}
          onSuccess={() => fetchShifts()}
        />
      )}
    </div>
  );
}
