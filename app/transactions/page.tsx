"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, ChevronDown, ChevronUp, CalendarRange } from 'lucide-react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import dayjs, { Dayjs } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { DateRange, Range, RangeKeyDict } from 'react-date-range'
import { format, addDays, subDays, startOfYear, isWithinInterval, startOfMonth, subMonths, subYears, isBefore, isAfter } from 'date-fns'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import './Calendar.css'
import { useTransactions, Transaction } from "@/lib/client"

dayjs.extend(isBetween)

type DayTime = 'morning' | 'evening' | 'full'

interface TransactionDisplay extends Transaction {
  type: 'sale' | 'refund'
  items: string[] 
  customerName?: string
  reference: string
  storeId: string
}

const timeOptions = [
  { value: "today", label: "Today" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
] as const

const weeklyOptions = [
  { value: "current", label: "Current Week" },
  { value: "last", label: "Last Week" },
  { value: "last2", label: "2 Weeks Ago" },
  { value: "last3", label: "3 Weeks Ago" }
] as const

const monthlyOptions = [
  { value: "current", label: "Current Month" },
  { value: "last", label: "Last Month" },
  { value: "last2", label: "2 Months Ago" },
  { value: "last3", label: "3 Months Ago" },
  { value: "last6", label: "6 Months Ago" }
] as const

const yearlyOptions = [
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" }
] as const

const stores = [
  { id: "all-stores", name: "All Stores" },
  { id: "store1", name: "Store 1" },
  { id: "store2", name: "Store 2" },
  { id: "store3", name: "Store 3" },
] as const

// Memoize the transaction card component
const TransactionCard = memo(({ 
  transaction, 
  isExpanded, 
  onToggle 
}: {
  transaction: TransactionDisplay
  isExpanded: boolean
  onToggle: () => void
}) => {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${transaction.type === 'refund' ? 'text-red-500' : 'text-green-500'}`}>
                {transaction.type === 'refund' ? 'Refund' : 'Sale'}
              </span>
              <span className="text-sm text-muted-foreground">
                {transaction.time || transaction.date}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {transaction.items.join(', ')}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-lg font-semibold ${transaction.type === 'refund' ? 'text-red-500' : 'text-green-500'}`}>
              OMR {Math.abs(transaction.amount).toFixed(2)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-muted"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="pt-4 border-t space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <span className="ml-2 font-medium">{transaction.customerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Payment:</span>
                <span className="ml-2">{transaction.paymentMethod}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reference:</span>
                <span className="ml-2 font-mono">{transaction.reference}</span>
              </div>
              {transaction.notes && (
                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="ml-2">{transaction.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})
TransactionCard.displayName = 'TransactionCard'

export default function TransactionsPage() {
  const { transactions, isLoading } = useTransactions()
  
  const [selectedPeriod, setSelectedPeriod] = useState<keyof typeof timeOptions[number]>("today")
  const [timeOfDay, setTimeOfDay] = useState<DayTime>("morning")
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>([])
  const [selectedStore, setSelectedStore] = useState("all-stores")
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: 'selection'
    } as Range
  ])
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // Reset dates when period changes
    setDateRange([{
      startDate: undefined,
      endDate: undefined,
      key: 'selection'
    } as Range])
  }, [selectedPeriod])

  useEffect(() => {
    // Check for time of day
    const hour = new Date().getHours()
    if (hour < 12) {
      setTimeOfDay('morning')
    } else if (hour < 18) {
      setTimeOfDay('evening')
    } else {
      setTimeOfDay('full')
    }
    
    // Set hasMounted to prevent hydration mismatch
    setHasMounted(true)
  }, [])

  const getMinMaxDates = useCallback(() => {
    const today = new Date()
    switch (selectedPeriod) {
      case 'weekly':
        return {
          minDate: subDays(today, 7),
          maxDate: today
        }
      case 'monthly':
        return {
          minDate: startOfMonth(subMonths(today, 1)),
          maxDate: today
        }
      case 'yearly':
        return {
          minDate: startOfYear(today),
          maxDate: today
        }
      default:
        return {
          minDate: today,
          maxDate: today
        }
    }
  }, [selectedPeriod])

  const getDateRangeText = useCallback(() => {
    const { startDate, endDate } = dateRange[0]
    if (!startDate) {
      return 'Select days'
    }

    if (!endDate || startDate === endDate) {
      return format(startDate, 'MMM d, yyyy')
    }
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
  }, [dateRange])

  // Convert transactions from our data hook to the format expected by the UI
  const getTransactions = useCallback((): TransactionDisplay[] => {
    if (!transactions) return []
    
    let result: TransactionDisplay[] = []
    
    if (selectedPeriod === 'today') {
      if (timeOfDay === 'full') {
        result = [...transactions.today.morning, ...transactions.today.evening].map(t => ({
          ...t,
          type: t.status === 'refunded' ? 'refund' : 'sale',
          items: [`${t.items} items`],
          customerName: t.customer || 'Anonymous', 
          reference: t.id,
          storeId: 'store1',
          notes: t.status === 'refunded' ? 'Item returned' : undefined
        }))
      } else {
        result = transactions.today[timeOfDay].map(t => ({
          ...t,
          type: t.status === 'refunded' ? 'refund' : 'sale',
          items: [`${t.items} items`],
          customerName: t.customer || 'Anonymous',
          reference: t.id,
          storeId: 'store1',
          notes: t.status === 'refunded' ? 'Item returned' : undefined
        }))
      }
    } else if (selectedPeriod === 'weekly') {
      result = transactions.thisWeek.map(t => ({
        ...t,
        type: t.status === 'refunded' ? 'refund' : 'sale',
        items: [`${t.items} items`],
        customerName: t.customer || 'Anonymous',
        reference: t.id,
        storeId: 'store1',
        date: t.time,
        notes: t.status === 'refunded' ? 'Item returned' : undefined
      }))
    } else if (selectedPeriod === 'monthly') {
      result = transactions.thisMonth.map(t => ({
        ...t,
        type: t.status === 'refunded' ? 'refund' : 'sale',
        items: [`${t.items} items`],
        customerName: t.customer || 'Anonymous',
        reference: t.id,
        storeId: 'store1',
        date: t.time,
        notes: t.status === 'refunded' ? 'Item returned' : undefined
      }))
    } else if (selectedPeriod === 'yearly') {
      // For yearly, we'll use thisMonth as a placeholder
      result = transactions.thisMonth.map(t => ({
        ...t,
        type: t.status === 'refunded' ? 'refund' : 'sale',
        items: [`${t.items} items`],
        customerName: t.customer || 'Anonymous',
        reference: t.id,
        storeId: 'store1',
        date: t.time,
        notes: t.status === 'refunded' ? 'Item returned' : undefined
      }))
    }
    
    // Filter by store if needed
    if (selectedStore !== 'all-stores') {
      result = result.filter(t => t.storeId === selectedStore)
    }
    
    return result
  }, [transactions, selectedPeriod, timeOfDay, selectedStore])

  const displayTransactions = useMemo(() => getTransactions(), [getTransactions])

  const toggleTransaction = useCallback((id: string) => {
    setExpandedTransactions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }, [])

  const getBackgroundPosition = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'left-1 right-[66.666%] bg-background'
      case 'evening':
        return 'left-[33.333%] right-[33.333%] bg-zinc-800'
      case 'full':
        return 'left-[66.666%] right-1 bg-purple-600'
      default:
        return 'left-1 right-[66.666%] bg-background'
    }
  }
  
  // If not mounted yet or data is loading, show loading state
  if (!hasMounted || isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-semibold">Transactions</h1>
            <div className="w-[180px] h-10" /> {/* Placeholder to maintain layout */}
          </div>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          {hasMounted ? (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[180px] h-10" /> /* Placeholder to maintain layout */
          )}
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {hasMounted ? (
              <Select value={selectedPeriod} onValueChange={(value: any) => {
                setSelectedPeriod(value)
              }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[140px] h-10" /> /* Placeholder to maintain layout */
            )}

            {selectedPeriod !== 'today' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal min-w-[240px]"
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {getDateRangeText()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <DateRange
                      className="custom-date-range"
                      ranges={dateRange}
                      onChange={(item) => setDateRange([item.selection])}
                      minDate={getMinMaxDates().minDate}
                      maxDate={getMinMaxDates().maxDate}
                      rangeColors={['hsl(var(--primary))']}
                      showMonthAndYearPickers={true}
                      showDateDisplay={false}
                      direction="horizontal"
                      months={1}
                      weekStartsOn={0}
                      disabledDay={(date) => {
                        const today = new Date();
                        switch(selectedPeriod) {
                          case 'monthly':
                            // Allow full month selection
                            return isBefore(date, startOfMonth(subMonths(today, 1))) || isAfter(date, today);
                          case 'yearly':
                            // Allow full year selection
                            return isBefore(date, startOfYear(subYears(today, 1))) || isAfter(date, today);
                          case 'weekly':
                            // Allow full week selection
                            return isBefore(date, subDays(today, 7)) || isAfter(date, today);
                          default:
                            // For today, only allow today
                            return date.getDate() !== today.getDate() || 
                                  date.getMonth() !== today.getMonth() || 
                                  date.getFullYear() !== today.getFullYear();
                        }
                      }}
                    />
                    {dateRange[0].startDate && (
                      <div className="border-t p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm text-muted-foreground">
                            {dateRange[0].startDate && dateRange[0].endDate && (
                              <>
                                {format(dateRange[0].startDate, 'MMM d')} -{' '}
                                {format(dateRange[0].endDate, 'MMM d, yyyy')}
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDateRange([{
                                startDate: undefined,
                                endDate: undefined,
                                key: 'selection'
                              } as Range])
                            }}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          {selectedPeriod === "today" && (
            <div className="inline-flex items-center rounded-full border p-1 w-fit bg-muted relative">
              <div
                className={`absolute inset-y-1 rounded-full transition-all duration-300 ease-in-out shadow-sm ${getBackgroundPosition()}`}
              />
              <button
                className={`px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${timeOfDay === "morning"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setTimeOfDay("morning")}
              >
                Morning
              </button>
              <button
                className={`px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${timeOfDay === "evening"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setTimeOfDay("evening")}
              >
                Evening
              </button>
              <button
                className={`px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${timeOfDay === "full"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setTimeOfDay("full")}
              >
                Full Day
              </button>
            </div>
          )}
        </div>

        {displayTransactions && displayTransactions.length > 0 ? (
          <div className="grid gap-4">
            {displayTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                isExpanded={expandedTransactions.includes(transaction.id)}
                onToggle={() => toggleTransaction(transaction.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              No transactions
            </h2>
          </Card>
        )}
      </div>
    </Layout>
  )
}