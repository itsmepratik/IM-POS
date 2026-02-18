"use client"

import { useState, useEffect, useMemo } from "react"
import { subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, eachDayOfInterval, format } from "date-fns"
import { useBranch } from "@/lib/contexts/BranchContext"
import { createClient } from "@/supabase/client"
import { getProfitsReport } from "@/app/actions/profits"

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
  isSalesLoading: boolean
  isProfitLoading: boolean
  lastUpdated: Date | null
  
  // Actions
  refreshData: () => Promise<void>
}

// === HOOK IMPLEMENTATION ===

export function useDashboardData(initialSalesMetrics?: SalesMetrics): UseDashboardDataReturn {
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
  const [isLoading, setIsLoading] = useState(!initialSalesMetrics)
  const [isSalesLoading, setIsSalesLoading] = useState(!initialSalesMetrics)
  const [isProfitLoading, setIsProfitLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialSalesMetrics ? new Date() : null)
  
  // === METRICS STATE ===
  
  // Sales Metrics
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>(initialSalesMetrics || {
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
  
  // Helper to fetch from Edge Function
  const fetchMetric = async (path: string, payload: any) => {
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke(`dashboard-metrics/${path}`, {
      body: payload
    })
    if (error) throw error
    return data
  }

  const fetchSalesMetrics = async (): Promise<SalesMetrics> => {
    // Handle branch filter: ensure we pass null if it's 'all' or undefined
    const shopId = (branchFilter === 'all' || !branchFilter) ? undefined : branchFilter
    
    // === CARD METRICS (ALWAYS TODAY) ===
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const yesterdayStart = startOfDay(subDays(new Date(), 1))
    const yesterdayEnd = endOfDay(subDays(new Date(), 1))

    let totalSales = 0
    let previousPeriodSales = 0
    let topProducts: TopProduct[] = []
    let salesTrend: TrendPoint[] = []
    let realTransactionCount = 0
    
    try {
        setIsSalesLoading(true)
        // Parallel Fetching for speed
        const [todayRevenue, yesterdayRevenue, topItemsData, trendData, todayTxCount, yesterdayTxCount] = await Promise.all([
            fetchMetric('revenue', { startDate: todayStart, endDate: todayEnd, shopId }),
            fetchMetric('revenue', { startDate: yesterdayStart, endDate: yesterdayEnd, shopId }),
            fetchMetric('top-items', { startDate: new Date(0), endDate: new Date(), shopId }),
            fetchMetric('sales-trend', { startDate: dateRange.start, endDate: dateRange.end, shopId }),
            fetchMetric('transaction-count', { startDate: todayStart, endDate: todayEnd, shopId }),
            fetchMetric('transaction-count', { startDate: yesterdayStart, endDate: yesterdayEnd, shopId })
        ])

        totalSales = Number(todayRevenue) || 0
        previousPeriodSales = Number(yesterdayRevenue) || 0
        topProducts = topItemsData || []
        // Use real transaction count
        realTransactionCount = todayTxCount || 0
        
        // Process trend data
        const salesMap = new Map<string, number>()
        if (Array.isArray(trendData)) {
            trendData.forEach((item: any) => {
                salesMap.set(item.sale_date, Number(item.total_sales))
            })
        }

        const days = eachDayOfInterval({
          start: dateRange.start,
          end: dateRange.end
        })

        salesTrend = days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          return {
            date: dateKey,
            value: salesMap.get(dateKey) || 0
          }
        })

    } catch (e) {
        console.error("Error fetching sales metrics from Edge Function:", e)
    } finally {
        setIsSalesLoading(false)
    }
    
    // Calculate change percentage (Today vs Yesterday)
    const changePercentage = previousPeriodSales > 0 
      ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100
      : 0
    
    // Derived metrics (mock or estimation)
    const durationDays = Math.max(1, Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    ))
    const transactionCount = realTransactionCount; // Use the fetched count
    // avgTicketValue based on today's sales
    const avgTicketValue = transactionCount > 0 ? totalSales / transactionCount : 0 
    
    // Sales by category (mock distribution)
    const categories = ["Oil", "Filters", "Parts", "Additives", "Services"]
    const salesByCategory = categories.map((category, index) => {
      let percentage = 0
      switch(index) {
        case 0: percentage = 35; break;
        case 1: percentage = 25; break;
        case 2: percentage = 20; break;
        case 3: percentage = 15; break;
        case 4: percentage = 5; break;
      }
      return {
        category,
        amount: (totalSales * percentage) / 100,
        percentage
      }
    })
    
    // Find best selling day
    const bestSellingDay = salesTrend.reduce((best: any, current: any) => 
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
      salesTrend: salesTrend as TrendPoint[],
      bestSellingDay
    }

    setSalesMetrics(metrics)
    return metrics
  }
  
  const fetchProfitMetrics = async (currentSalesMetrics: SalesMetrics) => {
    // Determine dates and shop filter
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const yesterdayStart = startOfDay(subDays(new Date(), 1))
    const yesterdayEnd = endOfDay(subDays(new Date(), 1))
    
    // Handle branch filter: must match what we pass to getProfitsReport
    // getProfitsReport takes string | undefined. If 'all', pass undefined.
    const shopId = (branchFilter === 'all' || !branchFilter) ? undefined : branchFilter

    try {
        setIsProfitLoading(true)
        // 1. Fetch Today's Profit via Edge Function
        const grossProfit = await fetchMetric('profits-card', { 
            startDate: todayStart, 
            endDate: todayEnd, 
            shopId 
        })
        
        // 2. Fetch Yesterday's Profit via Edge Function
        const previousPeriodProfit = await fetchMetric('profits-card', { 
            startDate: yesterdayStart, 
            endDate: yesterdayEnd, 
            shopId 
        })

        // Calculate profit change percentage
        const profitChangePercentage = previousPeriodProfit > 0
          ? ((grossProfit - previousPeriodProfit) / previousPeriodProfit) * 100
          : 0
        
        // Calculate profit margin
        const profitMargin = currentSalesMetrics.totalSales > 0
          ? (grossProfit / currentSalesMetrics.totalSales) * 100
          : 0
        
        // Profit by category (Still mocking distribution for now as detailed breakdown is heavy)
        // Ideally we would aggregate todayReport by category here
        const profitByCategory = currentSalesMetrics.salesByCategory.map(category => {
          // Approximate margin based on real total margin for consistency
          const amount = category.amount * (profitMargin / 100)
          return {
            category: category.category,
            amount: amount,
            percentage: grossProfit > 0 ? (amount / grossProfit) * 100 : 0,
            margin: profitMargin
          }
        })
        
        // Profit trend follows sales trend but with real margin applied (approximation)
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
    } catch (error) {
        console.error("Error fetching profit metrics:", error)
        // Fallback to 0 or keep existing
    } finally {
        setIsProfitLoading(false)
    }
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
    const shopId = (branchFilter === 'all' || !branchFilter) ? undefined : branchFilter
    
    let metricsData = []
    try {
        metricsData = await fetchMetric('payment-types', { shopId })
    } catch (e) {
        console.error("Error fetching payment metrics:", e)
    }

    // Prepare default methods
    const methodMap = new Map<string, PaymentMethodData>([
      ["Cash", { method: "Cash", amount: 0, count: 0, percentage: 0 }],
      ["Mobile", { method: "Mobile", amount: 0, count: 0, percentage: 0 }],
      ["Card", { method: "Card", amount: 0, count: 0, percentage: 0 }]
    ])

    // Calculate totals for percentage
    const totalAmount = metricsData?.reduce((sum: number, item: any) => sum + Number(item.total_amount), 0) || 0;

    // Merge DB data into map
    if (Array.isArray(metricsData)) {
      metricsData.forEach((item: any) => {
        let name = item.payment_method || "Unknown"
        // Normalize name: Title Case
        if (name && typeof name === 'string') {
          name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        }
        if (name === "Transfer") name = "Mobile";

        methodMap.set(name, {
          method: name,
          amount: Number(item.total_amount),
          count: Number(item.transaction_count),
          percentage: totalAmount > 0 ? (Number(item.total_amount) / totalAmount) * 100 : 0
        })
      })
    }

    const byPaymentMethod = Array.from(methodMap.values())
    // Sort: Cash, Mobile, Card
    byPaymentMethod.sort((a, b) => {
       const order = ["Cash", "Mobile", "Card"];
       const indexA = order.indexOf(a.method);
       const indexB = order.indexOf(b.method);
       if (indexA !== -1 && indexB !== -1) return indexA - indexB;
       if (indexA !== -1) return -1;
       if (indexB !== -1) return 1;
       return b.percentage - a.percentage;
    })

    setPaymentMetrics({
      byPaymentMethod,
      trend: [] 
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
    // We don't block with global isLoading anymore to allow progressive loading
    // But we set individual loading states in their respective fetch functions
    
    try {
      // Start independent calls in parallel
      fetchInventoryMetrics()
      fetchPaymentMetrics({ ...salesMetrics }) // Pass existing sales metrics as it doesn't really depend on it
      
      // Sales metrics is the dependency for others
      const currentSalesMetrics = await fetchSalesMetrics()
      
      // Once sales is done, fetch dependents
      fetchProfitMetrics(currentSalesMetrics)
      fetchCustomerMetrics(currentSalesMetrics)
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching dashboard data", error)
    } finally {
      setIsLoading(false) // Global loading off
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
    isSalesLoading,
    isProfitLoading,
    lastUpdated,
    
    // Actions
    refreshData
  }
}