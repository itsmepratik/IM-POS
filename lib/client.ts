"use client"

// This file will be the central place for Supabase client configuration
// For now, it just provides a placeholder for the future integration

export interface DatabaseClient {
  initialized: boolean
}

class DatabaseClientImpl implements DatabaseClient {
  initialized: boolean = false

  constructor() {
    // In the future, this will initialize the Supabase client
    console.log("Database client initialized - placeholder for Supabase")
    this.initialized = true
  }
}

// Singleton instance
let client: DatabaseClient | null = null

export function getClient(): DatabaseClient {
  if (!client) {
    client = new DatabaseClientImpl()
  }
  return client
}

// Export hooks here to provide a central import point
export { useInventory } from './hooks/data/useInventory'
export { useBranchData } from './hooks/data/useBranchData'
export { useUsers } from './hooks/data/useUsers'
export { useTransactions } from './hooks/data/useTransactions'

// Re-export types for convenience
export type { InventoryItem } from './hooks/data/useInventory'
export type { Branch } from './hooks/data/useBranchData'
export type { UserType } from './hooks/data/useUsers'
export type { Transaction, AllTransactions } from './hooks/data/useTransactions' 