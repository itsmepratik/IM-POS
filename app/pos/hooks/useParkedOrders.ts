"use client";

import { useState, useEffect, useCallback } from "react";
import { ParkedOrder, CartItem, TradeinBattery } from "../types";

const STORAGE_KEY = "pos_parked_orders";

export interface ParkOrderParams {
  cart: CartItem[];
  appliedDiscount: { type: "percentage" | "amount"; value: number } | null;
  appliedTradeInAmount: number;
  tradeinBatteries?: TradeinBattery[];
  currentCustomer: any | null;
  carPlateNumber?: string;
  subtotal: number;
  total: number;
  note?: string;
}

export function useParkedOrders() {
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load parked orders from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setParkedOrders(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load parked orders from localStorage:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save parked orders to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parkedOrders));
    } catch (error) {
      console.error("Failed to save parked orders to localStorage:", error);
    }
  }, [parkedOrders, isInitialized]);

  const generateOrderNumber = useCallback((): string => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `P-${randomSuffix}`;
  }, []);

  const parkOrder = useCallback(
    (params: ParkOrderParams): ParkedOrder => {
      const newOrder: ParkedOrder = {
        id: `parked-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderNumber: generateOrderNumber(),
        createdAt: new Date().toISOString(),
        cart: params.cart,
        appliedDiscount: params.appliedDiscount,
        appliedTradeInAmount: params.appliedTradeInAmount,
        tradeinBatteries: params.tradeinBatteries,
        currentCustomer: params.currentCustomer,
        carPlateNumber: params.carPlateNumber,
        subtotal: params.subtotal,
        total: params.total,
        note: params.note,
      };

      setParkedOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    },
    [generateOrderNumber],
  );

  const deleteParkedOrder = useCallback((id: string) => {
    setParkedOrders((prev) => prev.filter((order) => order.id !== id));
  }, []);

  const clearAllParkedOrders = useCallback(() => {
    setParkedOrders([]);
  }, []);

  return {
    parkedOrders,
    parkedCount: parkedOrders.length,
    parkOrder,
    deleteParkedOrder,
    clearAllParkedOrders,
    isInitialized,
  };
}
