"use client"

import { useState, useEffect, useMemo } from "react"
import { subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, eachDayOfInterval, format } from "date-fns"
import { useBranch } from "@/app/branch-context"
import { createClient } from "@/supabase/client"

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
    start: startOfDay(subDays(new Date(), 6)),
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
  
  const fetchSalesMetrics = async (): Promise<SalesMetrics> => {
    const supabase = createClient()
    
    // Handle branch filter: ensure we pass null if it's 'all' or undefined
    const shopId = (branchFilter === 'all' || !branchFilter) ? null : branchFilter
    
    console.log("Fetching net revenue for shop:", shopId)

    // === CARD METRICS (ALWAYS TODAY) ===
    // We override the summary cards to always show TODAY's data for immediate relevance
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const yesterdayStart = startOfDay(subDays(new Date(), 1))
    const yesterdayEnd = endOfDay(subDays(new Date(), 1))

    // Calculate net revenue for TODAY
    const { data: netRevenue, error } = await supabase.rpc('get_net_revenue', {
      start_date: todayStart.toISOString(),
      end_date: todayEnd.toISOString(),
      filter_shop_id: shopId
    })

    if (error) {
      console.error('Error fetching net revenue:', error)
    }

    // Fetch net revenue for YESTERDAY (for comparison)
    const { data: prevNetRevenue, error: prevError } = await supabase.rpc('get_net_revenue', {
      start_date: yesterdayStart.toISOString(),
      end_date: yesterdayEnd.toISOString(),
      filter_shop_id: shopId
    })

    if (prevError) {
      console.error('Error fetching previous net revenue:', prevError)
    }
    
    const totalSales = Number(netRevenue) || 0
    const previousPeriodSales = Number(prevNetRevenue) || 0
    
    // Calculate change percentage (Today vs Yesterday)
    const changePercentage = previousPeriodSales > 0 
      ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100
      : 0
    
    // === TREND METRICS (RESPECT DATE RANGE) ===
    // The chart and lists still respect the selected date range (default 7 days)
    
    // Get date range duration in days for trend averages
    const durationDays = Math.max(1, Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    ))

    // Transaction count and average ticket (mock for now, should be real eventually)
    const transactionCount = Math.floor(durationDays * 25)
    const avgTicketValue = transactionCount > 0 ? totalSales / transactionCount : 0 /* Note: this uses Today's sales, might want to update later to use range sales */
    
    // Sales by category (mock distribution of real total)
    const categories = ["Oil", "Filters", "Parts", "Additives", "Services"]
    
    const salesByCategory = categories.map((category, index) => {
      // Fixed distribution
      let percentage = 0
      switch(index) {
        case 0: percentage = 35; break; // Oil
        case 1: percentage = 25; break; // Filters
        case 2: percentage = 20; break; // Parts
        case 3: percentage = 15; break; // Additives
        case 4: percentage = 5; break;  // Services
      }
      
      return {
        category,
        amount: (totalSales * percentage) / 100,
        percentage
      }
    })
    
    // Top products (mock)
    const topProducts = [
      {
        name: "Mobil 1 5W-30 (1L)",
        units: 145,
        revenue: 1200
      },
      {
        name: "Oil Filter OE-quality",
        units: 120,
        revenue: 800
      },
      {
        name: "Air Filter Premium",
        units: 95,
        revenue: 600
      },
      {
        name: "Brake Pads (Front)",
        units: 65,
        revenue: 500
      },
      {
        name: "Wiper Blades",
        units: 45,
        revenue: 300
      }
    ]
    
    // Sales trend over time (real data based on DATE RANGE)
    const { data: trendData, error: trendError } = await supabase.rpc('get_daily_sales', {
      start_date: dateRange.start.toISOString(),
      end_date: dateRange.end.toISOString(),
      filter_shop_id: shopId
    })

    if (trendError) {
      console.error('Error fetching sales trend:', trendError)
    }

    // Process trend data to fill gaps
    const salesMap = new Map<string, number>()
    if (trendData) {
      trendData.forEach((item: any) => {
        salesMap.set(item.sale_date, Number(item.total_sales))
      })
    }

    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end
    })

    const salesTrend = days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd')
      return {
        date: dateKey,
        value: salesMap.get(dateKey) || 0
      }
    })
    
    // Find best selling day
    const bestSellingDay = salesTrend.reduce((best, current) => 
      current.value > (best?.value || 0) ? current : best, 
      null as TrendPoint | null
    )?.date
    
    const metrics = {
      totalSales,
      previousPeriodSales,
      changePercentage,
      avgTicketValue,
      transactionCount,
      salesByCategory,
      topProducts,
      salesTrend,
      bestSellingDay
    }

    setSalesMetrics(metrics)
    return metrics
  }
  
  const fetchProfitMetrics = async (currentSalesMetrics: SalesMetrics) => {
    // Simulate API call (minimal delay for better responsiveness)
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // Calculate gross profit (fixed 35% of sales)
    const grossProfit = currentSalesMetrics.totalSales * 0.35
    
    // Calculate previous period profit
    const previousPeriodProfit = currentSalesMetrics.previousPeriodSales * 0.35
    
    // Calculate profit change percentage
    const profitChangePercentage = previousPeriodProfit > 0
      ? ((grossProfit - previousPeriodProfit) / previousPeriodProfit) * 100
      : 0
    
    // Calculate profit margin
    const profitMargin = currentSalesMetrics.totalSales > 0
      ? (grossProfit / currentSalesMetrics.totalSales) * 100
      : 0
    
    // Profit by category
    const profitByCategory = currentSalesMetrics.salesByCategory.map(category => {
      // Different product categories have different profit margins
      let margin
      
      switch (category.category) {
        case "Oil":
          margin = 25
          break
        case "Filters":
          margin = 40
          break
        case "Parts":
          margin = 30
          break
        case "Additives":
          margin = 45
          break
        case "Services":
          margin = 60
          break
        default:
          margin = 35
      }
      
      const amount = category.amount * (margin / 100)
      
      return {
        category: category.category,
        amount,
        percentage: grossProfit > 0 ? (amount / grossProfit) * 100 : 0,
        margin
      }
    })
    
    // Profit trend follows sales trend but with margin applied
    const profitTrend = currentSalesMetrics.salesTrend.map(point => ({
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
    // Simulate API call (minimal delay for better responsiveness)
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // Generate total item count (fixed)
    const totalItems = 1350
    
    // Calculate low stock and out of stock items (fixed)
    const lowStockItems = 65
    const outOfStockItems = 15
    
    // Calculate inventory value (fixed)
    const totalValue = 18500
    
    // Top inventory value items (fixed)
    const topInventoryValue = [
      {
        name: "Premium Motor Oil (Bulk)",
        value: 5500,
        quantity: 550
      },
      {
        name: "Brake Pad Sets",
        value: 3800,
        quantity: 140
      },
      {
        name: "Oil Filters",
        value: 3000,
        quantity: 380
      },
      {
        name: "Air Filters",
        value: 2500,
        quantity: 300
      },
      {
        name: "Wiper Blade Sets",
        value: 2000,
        quantity: 220
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
  
  const fetchCustomerMetrics = async (currentSalesMetrics: SalesMetrics) => {
    // Simulate API call (minimal delay for better responsiveness)
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // Total customers (fixed)
    const totalCustomers = 950
    
    // New customers (fixed)
    const newCustomers = 45
    
    // Returning customers
    const returningCustomers = totalCustomers - newCustomers
    
    // Average spend per customer
    const avgSpendPerCustomer = currentSalesMetrics.totalSales / (returningCustomers + newCustomers * 0.5)
    
    // Top customers (fixed)
    const topCustomers = [
      {
        name: "Al Mouj Auto Service",
        totalSpend: 6500,
        orderCount: 22
      },
      {
        name: "Muscat Motors",
        totalSpend: 5200,
        orderCount: 18
      },
      {
        name: "Autocare Express",
        totalSpend: 4100,
        orderCount: 14
      },
      {
        name: "Premium Auto Shop",
        totalSpend: 3500,
        orderCount: 11
      },
      {
        name: "Car Care Specialist",
        totalSpend: 2900,
        orderCount: 9
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
  
  const fetchPaymentMetrics = async (currentSalesMetrics: SalesMetrics) => {
    // Simulate API call (minimal delay for better responsiveness)
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // Payment methods and their distribution (fixed)
    const methods = [
      { method: "Card", percentage: 45 },
      { method: "Cash", percentage: 30 },
      { method: "Bank Transfer", percentage: 15 },
      { method: "Other", percentage: 10 }
    ]
    
    // Calculate amounts and transaction counts
    const byPaymentMethod = methods.map(m => {
      const amount = (currentSalesMetrics.totalSales * m.percentage) / 100
      const count = Math.floor((currentSalesMetrics.transactionCount * m.percentage) / 100)
      
      return {
        method: m.method,
        amount,
        count,
        percentage: m.percentage
      }
    })
    
    // Generate payment trend data
    const trend: PaymentTrendPoint[] = []
    
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
      // First fetch sales metrics as other metrics depend on it
      const currentSalesMetrics = await fetchSalesMetrics()
      
      // Then fetch other metrics using the sales data
      await Promise.all([
        fetchProfitMetrics(currentSalesMetrics),
        fetchInventoryMetrics(),
        fetchCustomerMetrics(currentSalesMetrics),
        fetchPaymentMetrics(currentSalesMetrics)
      ])
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching dashboard data", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Immediate data fetch when component mounts
  useEffect(() => {
    // Load data immediately when component mounts
    refreshData()
  }, []) // Empty dependency array ensures it only runs once on mount
  
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