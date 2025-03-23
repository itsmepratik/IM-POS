"use client"

import { useState, useEffect, useMemo } from "react"
import { addDays, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns"
import { useBranch } from "@/app/branch-context"

// === TYPES ===

// Date Range
export interface DateRange {
  start: Date
  end: Date
}

// Filter options
export interface DashboardFilters {
  dateRange: DateRange
  branchId?: string
  timeGranularity: "daily" | "weekly" | "monthly"
}

// Sales metrics
export interface SalesMetrics {
  totalSales: number
  previousPeriodSales: number
  changePercentage: number
  avgTicketValue: number
  transactionCount: number
  salesByCategory: CategorySales[]
  topProducts: TopProduct[]
  salesTrend: TrendPoint[]
  bestSellingDay?: string
}

export interface CategorySales {
  category: string
  amount: number
  percentage: number
}

export interface TopProduct {
  name: string
  units: number
  revenue: number
}

export interface TrendPoint {
  date: string
  value: number
}

// Profit metrics
export interface ProfitMetrics {
  grossProfit: number
  previousPeriodProfit: number
  profitChangePercentage: number
  profitMargin: number
  profitByCategory: ProfitByCategory[]
  profitTrend: TrendPoint[]
}

export interface ProfitByCategory {
  category: string
  amount: number
  percentage: number
  margin: number
}

// Inventory metrics
export interface InventoryMetrics {
  totalItems: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  topInventoryValue: InventoryValueItem[]
}

export interface InventoryValueItem {
  name: string
  value: number
  quantity: number
}

// Customer metrics
export interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  avgSpendPerCustomer: number
  topCustomers: TopCustomer[]
}

export interface TopCustomer {
  name: string
  totalSpend: number
  orderCount: number
}

// Payment metrics
export interface PaymentMetrics {
  byPaymentMethod: PaymentMethodData[]
  trend: PaymentTrendPoint[]
}

export interface PaymentMethodData {
  method: string
  count: number
  amount: number
  percentage: number
}

export interface PaymentTrendPoint {
  date: string
  cash?: number
  card?: number
  transfer?: number
  other?: number
}

// Hook return type
export interface UseDashboardDataReturn {
  // Metrics
  sales: SalesMetrics
  profit: ProfitMetrics
  inventory: InventoryMetrics
  customers: CustomerMetrics
  payments: PaymentMetrics
  
  // Filters and states
  filters: DashboardFilters
  setDateRange: (range: DateRange) => void
  setBranchFilter: (branchId?: string) => void
  setTimeGranularity: (granularity: "daily" | "weekly" | "monthly") => void
  
  // Preset date ranges
  setToday: () => void
  setYesterday: () => void
  setLast7Days: () => void
  setLast30Days: () => void
  setThisMonth: () => void
  setLastMonth: () => void
  
  // Loading states
  isLoading: boolean
  lastUpdated: Date | null
  
  // Actions
  refreshData: () => Promise<void>
}

// === HOOK IMPLEMENTATION ===

export function useDashboardData(): UseDashboardDataReturn {
  const { currentBranch } = useBranch()
  
  // === STATE ===
  
  // Filters
  const [dateRange, setDateRangeState] = useState<DateRange>({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date())
  })
  
  const [branchFilter, setBranchFilterState] = useState<string | undefined>(
    currentBranch?.id
  )
  
  const [timeGranularity, setTimeGranularity] = useState<"daily" | "weekly" | "monthly">("daily")
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // === METRICS STATE ===
  
  // Sales Metrics
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    totalSales: 0,
    previousPeriodSales: 0,
    changePercentage: 0,
    avgTicketValue: 0,
    transactionCount: 0,
    salesByCategory: [],
    topProducts: [],
    salesTrend: [],
  })
  
  // Profit Metrics
  const [profitMetrics, setProfitMetrics] = useState<ProfitMetrics>({
    grossProfit: 0,
    previousPeriodProfit: 0,
    profitChangePercentage: 0,
    profitMargin: 0,
    profitByCategory: [],
    profitTrend: []
  })
  
  // Inventory Metrics
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    topInventoryValue: []
  })
  
  // Customer Metrics
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    avgSpendPerCustomer: 0,
    topCustomers: []
  })
  
  // Payment Metrics
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics>({
    byPaymentMethod: [],
    trend: []
  })
  
  // Filters object
  const filters = useMemo(() => {
    return {
      dateRange,
      branchId: branchFilter,
      timeGranularity
    }
  }, [dateRange, branchFilter, timeGranularity])
  
  // === DATE RANGE PRESETS ===
  
  const setToday = () => {
    const today = new Date()
    setDateRangeState({
      start: startOfDay(today),
      end: endOfDay(today)
    })
  }
  
  const setYesterday = () => {
    const yesterday = subDays(new Date(), 1)
    setDateRangeState({
      start: startOfDay(yesterday),
      end: endOfDay(yesterday)
    })
  }
  
  const setLast7Days = () => {
    setDateRangeState({
      start: startOfDay(subDays(new Date(), 6)),
      end: endOfDay(new Date())
    })
  }
  
  const setLast30Days = () => {
    setDateRangeState({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfDay(new Date())
    })
  }
  
  const setThisMonth = () => {
    const today = new Date()
    setDateRangeState({
      start: startOfMonth(today),
      end: endOfDay(today)
    })
  }
  
  const setLastMonth = () => {
    const today = new Date()
    const lastMonth = subMonths(today, 1)
    setDateRangeState({
      start: startOfMonth(lastMonth),
      end: endOfMonth(lastMonth)
    })
  }
  
  // === DATA FETCHING LOGIC ===
  
  // This will be replaced with real Supabase queries in the future
  // For now, we're generating mock data
  
  const fetchSalesMetrics = async () => {
    // Simulate API call (reduced from 500ms to 50ms)
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Get date range duration in days
    const durationDays = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Generate mock sales total (more consistent than random)
    const basePerDay = 1500 // $1500 base sales per day
    const totalSales = durationDays * basePerDay * (1 + Math.random() * 0.5)
    
    // Generate previous period sales (slightly lower on average)
    const previousPeriodSales = totalSales * (0.8 + Math.random() * 0.3)
    
    // Calculate change percentage
    const changePercentage = ((totalSales - previousPeriodSales) / previousPeriodSales) * 100
    
    // Transaction count and average ticket
    const transactionCount = Math.floor(durationDays * 25 * (0.8 + Math.random() * 0.4))
    const avgTicketValue = totalSales / transactionCount
    
    // Sales by category
    const categories = ["Oil", "Filters", "Parts", "Additives", "Services"]
    let remainingPercentage = 100
    
    const salesByCategory = categories.map((category, index) => {
      // Last category gets whatever is left
      const isLast = index === categories.length - 1
      
      // Generate percentage for this category
      const percentage = isLast 
        ? remainingPercentage 
        : Math.round(remainingPercentage * (0.1 + Math.random() * 0.3))
      
      remainingPercentage -= percentage
      
      return {
        category,
        amount: (totalSales * percentage) / 100,
        percentage
      }
    })
    
    // Top products
    const topProducts = [
      {
        name: "Mobil 1 5W-30 (1L)",
        units: Math.floor(100 + Math.random() * 100),
        revenue: 1200 + Math.random() * 1000
      },
      {
        name: "Oil Filter OE-quality",
        units: Math.floor(80 + Math.random() * 100),
        revenue: 800 + Math.random() * 900
      },
      {
        name: "Air Filter Premium",
        units: Math.floor(60 + Math.random() * 100),
        revenue: 600 + Math.random() * 800
      },
      {
        name: "Brake Pads (Front)",
        units: Math.floor(50 + Math.random() * 50),
        revenue: 500 + Math.random() * 700
      },
      {
        name: "Wiper Blades",
        units: Math.floor(40 + Math.random() * 40),
        revenue: 300 + Math.random() * 500
      }
    ]
    
    // Sales trend over time
    const trendPoints = durationDays
    const salesTrend = Array(trendPoints).fill(0).map((_, i) => {
      // Base sales value with some randomness
      const day = new Date(dateRange.start)
      day.setDate(day.getDate() + i)
      
      // Higher sales on weekends, lower on mid-week
      const dayOfWeek = day.getDay() // 0 = Sunday, 6 = Saturday
      let dayFactor = 1
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayFactor = 1.3 // Weekend boost
      } else if (dayOfWeek === 3) {
        dayFactor = 0.8 // Mid-week dip
      }
      
      const value = basePerDay * dayFactor * (0.7 + Math.random() * 0.6)
      
      return {
        date: day.toISOString().split('T')[0],
        value
      }
    })
    
    // Find best selling day
    const bestSellingDay = salesTrend.reduce((best, current) => 
      current.value > (best?.value || 0) ? current : best, 
      null as TrendPoint | null
    )?.date
    
    setSalesMetrics({
      totalSales,
      previousPeriodSales,
      changePercentage,
      avgTicketValue,
      transactionCount,
      salesByCategory,
      topProducts,
      salesTrend,
      bestSellingDay
    })
  }
  
  const fetchProfitMetrics = async () => {
    // Simulate API call (reduced from 400ms to 40ms)
    await new Promise(resolve => setTimeout(resolve, 40))
    
    // Calculate gross profit (about 30-40% of sales)
    const grossProfit = salesMetrics.totalSales * (0.3 + Math.random() * 0.1)
    
    // Calculate previous period profit
    const previousPeriodProfit = salesMetrics.previousPeriodSales * (0.3 + Math.random() * 0.1)
    
    // Calculate profit change percentage
    const profitChangePercentage = ((grossProfit - previousPeriodProfit) / previousPeriodProfit) * 100
    
    // Calculate profit margin
    const profitMargin = (grossProfit / salesMetrics.totalSales) * 100
    
    // Profit by category
    const profitByCategory = salesMetrics.salesByCategory.map(category => {
      // Different product categories have different profit margins
      let margin
      
      switch (category.category) {
        case "Oil":
          margin = 25 + Math.random() * 10
          break
        case "Filters":
          margin = 40 + Math.random() * 10
          break
        case "Parts":
          margin = 30 + Math.random() * 15
          break
        case "Additives":
          margin = 45 + Math.random() * 10
          break
        case "Services":
          margin = 60 + Math.random() * 15
          break
        default:
          margin = 35 + Math.random() * 10
      }
      
      const amount = category.amount * (margin / 100)
      
      return {
        category: category.category,
        amount,
        percentage: (amount / grossProfit) * 100,
        margin
      }
    })
    
    // Profit trend follows sales trend but with margin applied
    const profitTrend = salesMetrics.salesTrend.map(point => ({
      date: point.date,
      value: point.value * (profitMargin / 100)
    }))
    
    setProfitMetrics({
      grossProfit,
      previousPeriodProfit,
      profitChangePercentage,
      profitMargin,
      profitByCategory,
      profitTrend
    })
  }
  
  const fetchInventoryMetrics = async () => {
    // Simulate API call (reduced from 450ms to 45ms)
    await new Promise(resolve => setTimeout(resolve, 45))
    
    // Generate total item count
    const totalItems = 1200 + Math.floor(Math.random() * 300)
    
    // Calculate low stock and out of stock items
    const lowStockItems = Math.floor(totalItems * (0.05 + Math.random() * 0.05))
    const outOfStockItems = Math.floor(totalItems * (0.01 + Math.random() * 0.02))
    
    // Calculate inventory value (average of $10-15 per item)
    const avgValuePerItem = 10 + Math.random() * 5
    const totalValue = totalItems * avgValuePerItem
    
    // Top inventory value items
    const topInventoryValue = [
      {
        name: "Premium Motor Oil (Bulk)",
        value: 5000 + Math.random() * 1000,
        quantity: 500 + Math.floor(Math.random() * 100)
      },
      {
        name: "Brake Pad Sets",
        value: 3500 + Math.random() * 1000,
        quantity: 120 + Math.floor(Math.random() * 50)
      },
      {
        name: "Oil Filters",
        value: 2800 + Math.random() * 800,
        quantity: 350 + Math.floor(Math.random() * 100)
      },
      {
        name: "Air Filters",
        value: 2200 + Math.random() * 700,
        quantity: 280 + Math.floor(Math.random() * 80)
      },
      {
        name: "Wiper Blade Sets",
        value: 1800 + Math.random() * 500,
        quantity: 200 + Math.floor(Math.random() * 60)
      }
    ]
    
    setInventoryMetrics({
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      topInventoryValue
    })
  }
  
  const fetchCustomerMetrics = async () => {
    // Simulate API call (reduced from 500ms to 50ms)
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Total customers
    const totalCustomers = 800 + Math.floor(Math.random() * 200)
    
    // New customers (about 5-10% of total)
    const newCustomers = Math.floor(totalCustomers * (0.05 + Math.random() * 0.05))
    
    // Returning customers
    const returningCustomers = totalCustomers - newCustomers
    
    // Average spend per customer
    const avgSpendPerCustomer = salesMetrics.totalSales / (returningCustomers + newCustomers * 0.5)
    
    // Top customers
    const topCustomers = [
      {
        name: "Al Mouj Auto Service",
        totalSpend: 5000 + Math.random() * 3000,
        orderCount: 15 + Math.floor(Math.random() * 10)
      },
      {
        name: "Muscat Motors",
        totalSpend: 4000 + Math.random() * 2000,
        orderCount: 12 + Math.floor(Math.random() * 8)
      },
      {
        name: "Autocare Express",
        totalSpend: 3500 + Math.random() * 1500,
        orderCount: 10 + Math.floor(Math.random() * 7)
      },
      {
        name: "Premium Auto Shop",
        totalSpend: 3000 + Math.random() * 1000,
        orderCount: 8 + Math.floor(Math.random() * 6)
      },
      {
        name: "Car Care Specialist",
        totalSpend: 2500 + Math.random() * 1000,
        orderCount: 7 + Math.floor(Math.random() * 5)
      }
    ]
    
    setCustomerMetrics({
      totalCustomers,
      newCustomers,
      returningCustomers,
      avgSpendPerCustomer,
      topCustomers
    })
  }
  
  const fetchPaymentMetrics = async () => {
    // Simulate API call (reduced from 450ms to 45ms)
    await new Promise(resolve => setTimeout(resolve, 45))
    
    // Payment methods and their distribution
    const methods = [
      { method: "Card", percentage: 45 + Math.random() * 10 },
      { method: "Cash", percentage: 30 + Math.random() * 10 },
      { method: "Bank Transfer", percentage: 15 + Math.random() * 5 },
      { method: "Other", percentage: 0 } // Will be calculated
    ]
    
    // Make sure percentages add up to 100%
    const calculatedSum = methods.reduce((sum, m) => sum + m.percentage, 0)
    methods[3].percentage = 100 - calculatedSum
    
    // Calculate amounts and transaction counts
    const byPaymentMethod = methods.map(m => {
      const amount = (salesMetrics.totalSales * m.percentage) / 100
      const count = Math.floor((salesMetrics.transactionCount * m.percentage) / 100)
      
      return {
        method: m.method,
        amount,
        count,
        percentage: m.percentage
      }
    })
    
    // Generate payment trend data
    const trend = []
    
    setPaymentMetrics({
      byPaymentMethod,
      trend
    })
  }
  
  // Function to set date range
  const setDateRange = (range: DateRange) => {
    setDateRangeState(range)
  }
  
  // Function to set branch filter
  const setBranchFilter = (branchId?: string) => {
    setBranchFilterState(branchId)
  }
  
  // Function to refresh all data
  const refreshData = async () => {
    setIsLoading(true)
    
    try {
      // Run all fetches concurrently instead of sequentially to improve performance
      await Promise.all([
        fetchSalesMetrics(),
        fetchProfitMetrics(),
        fetchInventoryMetrics(),
        fetchCustomerMetrics(),
        fetchPaymentMetrics()
      ])
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching dashboard data", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Effect to re-fetch data when filters change
  useEffect(() => {
    refreshData()
    
    // In a real implementation, we'd set up real-time subscriptions here
    // with Supabase for live updates
    
    // For demo purposes, simulate periodic updates
    const interval = setInterval(() => {
      refreshData()
    }, 5 * 60 * 1000) // Refresh every 5 minutes
    
    return () => clearInterval(interval)
  }, [
    dateRange.start.toISOString(),
    dateRange.end.toISOString(),
    branchFilter,
    timeGranularity
  ])
  
  // Return all dashboard data and controls
  return {
    // Metrics
    sales: salesMetrics,
    profit: profitMetrics,
    inventory: inventoryMetrics,
    customers: customerMetrics,
    payments: paymentMetrics,
    
    // Filters and controls
    filters,
    setDateRange,
    setBranchFilter,
    setTimeGranularity,
    
    // Date range presets
    setToday,
    setYesterday,
    setLast7Days,
    setLast30Days,
    setThisMonth,
    setLastMonth,
    
    // Loading states
    isLoading,
    lastUpdated,
    
    // Actions
    refreshData
  }
} 