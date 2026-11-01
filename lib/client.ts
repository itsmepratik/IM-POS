"use client"

// Central import point for client-side data hooks.
export { useInventory } from './hooks/data/useInventory'
export { useBranchData } from './hooks/data/useBranchData'
export { useTransactions } from './hooks/data/useTransactions'
export { useCustomers } from './hooks/data/useCustomers'

// Re-export types for convenience
export type { InventoryItem } from './hooks/data/useInventory'
export type { Branch } from './hooks/data/useBranchData'
export type { Transaction, AllTransactions } from './hooks/data/useTransactions'
export type { CustomerData, Vehicle } from './hooks/data/useCustomers'
