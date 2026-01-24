"use client";

import { useState, useCallback } from "react";
import { TradeinBattery } from "../types";

interface CurrentBatteryEntry {
  size: string;
  status: string;
  amount: number;
}

interface TradeInFormErrors {
  size: boolean;
  status: boolean;
  amount: boolean;
}

interface UseTradeInReturn {
  // State
  tradeinBatteries: TradeinBattery[];
  currentBatteryEntry: CurrentBatteryEntry;
  editingBatteryId: string | null;
  tradeinFormErrors: TradeInFormErrors;
  isTradeInDialogOpen: boolean;
  appliedTradeInAmount: number;

  // Actions
  setIsTradeInDialogOpen: (open: boolean) => void;
  setAppliedTradeInAmount: (amount: number) => void;
  setCurrentBatteryEntry: React.Dispatch<React.SetStateAction<CurrentBatteryEntry>>;
  calculateTotalTradeInAmount: () => number;
  validateCurrentBatteryEntry: () => boolean;
  addBatteryToTradein: () => void;
  editBattery: (batteryId: string) => void;
  updateEditedBattery: () => void;
  removeBatteryFromTradein: (batteryId: string) => void;
  cancelBatteryEdit: () => void;
  resetTradeInDialog: () => void;
}

export function useTradeIn(): UseTradeInReturn {
  // Trade-In Dialog State
  const [isTradeInDialogOpen, setIsTradeInDialogOpen] = useState(false);
  const [appliedTradeInAmount, setAppliedTradeInAmount] = useState<number>(0);

  // Trade-in battery states
  const [tradeinBatteries, setTradeinBatteries] = useState<TradeinBattery[]>([]);
  const [currentBatteryEntry, setCurrentBatteryEntry] = useState<CurrentBatteryEntry>({
    size: "",
    status: "",
    amount: 0,
  });
  const [editingBatteryId, setEditingBatteryId] = useState<string | null>(null);
  const [tradeinFormErrors, setTradeinFormErrors] = useState<TradeInFormErrors>({
    size: false,
    status: false,
    amount: false,
  });

  // Trade-in helper functions
  const calculateTotalTradeInAmount = useCallback(() => {
    return tradeinBatteries.reduce(
      (total, battery) => total + battery.amount,
      0
    );
  }, [tradeinBatteries]);

  const validateCurrentBatteryEntry = useCallback(() => {
    const errors = {
      size: !currentBatteryEntry.size,
      status: !currentBatteryEntry.status,
      amount: currentBatteryEntry.amount <= 0,
    };
    setTradeinFormErrors(errors);
    return !errors.size && !errors.status && !errors.amount;
  }, [currentBatteryEntry]);

  const addBatteryToTradein = useCallback(() => {
    if (!validateCurrentBatteryEntry()) return;

    const newBattery: TradeinBattery = {
      id: `battery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      size: currentBatteryEntry.size,
      status: currentBatteryEntry.status as "scrap" | "resellable",
      amount: currentBatteryEntry.amount,
    };

    setTradeinBatteries((prev) => [...prev, newBattery]);
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setTradeinFormErrors({ size: false, status: false, amount: false });
  }, [currentBatteryEntry, validateCurrentBatteryEntry]);

  const editBattery = useCallback((batteryId: string) => {
    const battery = tradeinBatteries.find((b) => b.id === batteryId);
    if (battery) {
      setCurrentBatteryEntry({
        size: battery.size,
        status: battery.status,
        amount: battery.amount,
      });
      setEditingBatteryId(batteryId);
    }
  }, [tradeinBatteries]);

  const updateEditedBattery = useCallback(() => {
    if (!validateCurrentBatteryEntry() || !editingBatteryId) return;

    setTradeinBatteries((prev) =>
      prev.map((battery) =>
        battery.id === editingBatteryId
          ? {
              ...battery,
              size: currentBatteryEntry.size,
              status: currentBatteryEntry.status as "scrap" | "resellable",
              amount: currentBatteryEntry.amount,
            }
          : battery
      )
    );

    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setEditingBatteryId(null);
    setTradeinFormErrors({ size: false, status: false, amount: false });
  }, [currentBatteryEntry, editingBatteryId, validateCurrentBatteryEntry]);

  const removeBatteryFromTradein = useCallback((batteryId: string) => {
    setTradeinBatteries((prev) =>
      prev.filter((battery) => battery.id !== batteryId)
    );
    if (editingBatteryId === batteryId) {
      setEditingBatteryId(null);
      setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
      setTradeinFormErrors({ size: false, status: false, amount: false });
    }
  }, [editingBatteryId]);

  const cancelBatteryEdit = useCallback(() => {
    setEditingBatteryId(null);
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setTradeinFormErrors({ size: false, status: false, amount: false });
  }, []);

  const resetTradeInDialog = useCallback(() => {
    setTradeinBatteries([]);
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setEditingBatteryId(null);
    setTradeinFormErrors({ size: false, status: false, amount: false });
  }, []);

  return {
    // State
    tradeinBatteries,
    currentBatteryEntry,
    editingBatteryId,
    tradeinFormErrors,
    isTradeInDialogOpen,
    appliedTradeInAmount,

    // Actions
    setIsTradeInDialogOpen,
    setAppliedTradeInAmount,
    setCurrentBatteryEntry,
    calculateTotalTradeInAmount,
    validateCurrentBatteryEntry,
    addBatteryToTradein,
    editBattery,
    updateEditedBattery,
    removeBatteryFromTradein,
    cancelBatteryEdit,
    resetTradeInDialog,
  };
}
