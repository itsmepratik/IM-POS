"use client";

import { useState, useEffect, useCallback } from "react";
import { useBranch } from "@/lib/contexts/DataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Ban,
  Search,
  XCircle,
  ArrowLeft,
  Check,
  AlertCircle,
  Clock,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransactionInfo {
  referenceNumber: string;
  totalAmount: string;
  createdAt: string;
}

type Step = "menu" | "password" | "processing" | "complete";

export function VoidDialog({ open, onOpenChange }: VoidDialogProps) {
  const { currentBranch, inventoryLocationId } = useBranch();

  const [step, setStep] = useState<Step>("menu");
  const [mode, setMode] = useState<"last" | "invoice">("last");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [targetTransaction, setTargetTransaction] = useState<TransactionInfo | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voidResult, setVoidResult] = useState<{ success: boolean; message: string } | null>(null);

  const resetState = useCallback(() => {
    setStep("menu");
    setMode("last");
    setInvoiceRef("");
    setTargetTransaction(null);
    setLoadingTx(false);
    setTxError(null);
    setPassword("");
    setPasswordError(null);
    setIsProcessing(false);
    setVoidResult(null);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const fetchLastTransaction = useCallback(async () => {
    if (!inventoryLocationId) {
      setTxError("No location selected");
      return;
    }

    setLoadingTx(true);
    setTxError(null);
    setTargetTransaction(null);

    try {
      const res = await fetch(
        `/api/void-transaction?locationId=${encodeURIComponent(inventoryLocationId)}`
      );

      let data;
      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        setTxError(`API returned ${res.status}: ${text.slice(0, 200)}`);
        return;
      }

      if (!data.success) {
        setTxError(data.error || "No recent sale transaction found");
        return;
      }

      if (data.data.isVoided) {
        setTxError("Last transaction has already been voided");
        return;
      }

      setTargetTransaction({
        referenceNumber: data.data.referenceNumber,
        totalAmount: data.data.totalAmount,
        createdAt: data.data.createdAt,
      });
    } catch (err) {
      setTxError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingTx(false);
    }
  }, [inventoryLocationId]);

  useEffect(() => {
    if (open && mode === "last") {
      fetchLastTransaction();
    }
  }, [open, mode, fetchLastTransaction]);

  const handleLookupInvoice = async () => {
    const ref = invoiceRef.trim();
    if (!ref) {
      setTxError("Please enter an invoice reference number");
      return;
    }

    setTxError(null);
    setTargetTransaction(null);
    setLoadingTx(true);

    try {
      const res = await fetch(
        `/api/void-transaction?referenceNumber=${encodeURIComponent(ref)}`
      );

      let data;
      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        setTxError(`API returned ${res.status}: ${text.slice(0, 200)}`);
        return;
      }

      if (!data.success) {
        setTxError(data.error || "Transaction not found");
        return;
      }

      if (data.data.isVoided) {
        setTxError("This transaction has already been voided");
        return;
      }

      if (data.data.type !== "SALE") {
        setTxError(`Cannot void a ${data.data.type} transaction`);
        return;
      }

      setTargetTransaction({
        referenceNumber: data.data.referenceNumber,
        totalAmount: data.data.totalAmount,
        createdAt: data.data.createdAt,
      });
    } catch (err) {
      setTxError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleSelectMode = (selectedMode: "last" | "invoice") => {
    setMode(selectedMode);
    setTxError(null);
    setTargetTransaction(null);

    if (selectedMode === "last") {
      fetchLastTransaction();
    }
  };

  const proceedToPassword = () => {
    if (!targetTransaction?.referenceNumber) return;
    setPassword("");
    setPasswordError(null);
    setStep("password");
  };

  const handleVoid = async () => {
    const ref = targetTransaction?.referenceNumber;
    if (!ref || !currentBranch?.id || !inventoryLocationId) return;

    setStep("processing");
    setIsProcessing(true);
    setPasswordError(null);

    try {
      const res = await fetch("/api/void-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNumber: ref,
          supervisorPassword: password,
          locationId: inventoryLocationId,
          shopId: currentBranch.id,
          voidReason: mode === "last" ? "LAST_TRANSACTION" : "MANUAL_VOID",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setVoidResult({ success: true, message: `Transaction ${ref} voided successfully` });
      } else {
        setVoidResult({ success: false, message: data.error || "Failed to void transaction" });
      }
    } catch {
      setVoidResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setIsProcessing(false);
      setStep("complete");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Dialog open={open && step !== "complete"} onOpenChange={handleOpenChange}>
        <DialogContent
          className="w-[90%] max-w-md p-6 rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {step === "menu" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-semibold">
                  Void Transaction
                </DialogTitle>
                <DialogDescription className="text-center">
                  Select how you want to void a transaction
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button
                    variant={mode === "last" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleSelectMode("last")}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Last Transaction
                  </Button>
                  <Button
                    variant={mode === "invoice" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleSelectMode("invoice")}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    By Invoice
                  </Button>
                </div>

                {mode === "last" && (
                  <div className="border rounded-lg p-4 space-y-3">
                    {loadingTx ? (
                      <div className="flex items-center justify-center py-4">
                        <Spinner />
                      </div>
                    ) : txError ? (
                      <div className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{txError}</span>
                      </div>
                    ) : targetTransaction ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Most recent sale transaction</span>
                        </div>
                        <div className="font-medium text-lg">
                          {targetTransaction.referenceNumber}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium">
                            {targetTransaction.totalAmount} OMR
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Date</span>
                          <span>{formatDate(targetTransaction.createdAt)}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {mode === "invoice" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={invoiceRef}
                        onChange={(e) => {
                          setInvoiceRef(e.target.value);
                          setTxError(null);
                        }}
                        placeholder="Enter invoice reference number"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleLookupInvoice();
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLookupInvoice}
                        disabled={loadingTx || !invoiceRef.trim()}
                      >
                        {loadingTx ? <Spinner /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>

                    {txError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {txError}
                      </p>
                    )}

                    <AnimatePresence>
                      {targetTransaction && mode === "invoice" && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="border rounded-lg p-3 space-y-1"
                        >
                          <div className="font-medium">{targetTransaction.referenceNumber}</div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Amount: {targetTransaction.totalAmount} OMR</span>
                            <span>{formatDate(targetTransaction.createdAt)}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <DialogFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={!targetTransaction}
                    onClick={proceedToPassword}
                  >
                    Continue
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {step === "password" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-semibold">
                  Supervisor Authorization
                </DialogTitle>
                <DialogDescription className="text-center">
                  Enter the supervisor password to void{" "}
                  <span className="font-medium text-foreground">
                    {targetTransaction?.referenceNumber}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <Input
                  type="password"
                  placeholder="Enter supervisor password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="text-center text-lg py-6"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password) handleVoid();
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {passwordError}
                  </p>
                )}
              </div>

              <DialogFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("menu")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={!password}
                    onClick={handleVoid}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Void Transaction
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner className="h-8 w-8 mb-4" />
              <p className="text-muted-foreground">Voiding transaction...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={step === "complete"} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="w-[90%] max-w-sm rounded-lg">
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              {voidResult?.success ? (
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
              <AlertDialogTitle className="text-center">
                {voidResult?.success ? "Void Completed" : "Void Failed"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {voidResult?.message}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleOpenChange(false)}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
