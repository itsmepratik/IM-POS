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

dayjs.extend(isBetween)

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

interface Transaction {
  id: number
  type: 'sale' | 'refund'
  amount: number
  time?: string
  date?: string
  items: string[]
  customerName: string
  paymentMethod: string
  reference: string
  notes?: string
  storeId: string
}

type DayTime = 'morning' | 'evening' | 'full'

interface TodayTransactions {
  morning: Transaction[]
  evening: Transaction[]
}

interface AllTransactions {
  today: TodayTransactions
  weekly: Transaction[]
  monthly: Transaction[]
  yearly: Transaction[]
}

const mockTransactions: AllTransactions = {
  today: {
    morning: [
      { id: 1, type: 'sale', amount: 45.99, time: '09:15 AM', items: ['Oil Filter', '5W-30 Oil'], customerName: 'John Smith', paymentMethod: 'Credit Card', reference: 'TXN-001', notes: 'Regular maintenance service', storeId: 'store1' },
      { id: 2, type: 'sale', amount: 89.99, time: '10:30 AM', items: ['Brake Pads', 'Labor'], customerName: 'Sarah Johnson', paymentMethod: 'Cash', reference: 'TXN-002', notes: 'Front brake replacement', storeId: 'store2' },
      { id: 3, type: 'refund', amount: -25.00, time: '11:45 AM', items: ['Air Filter'], customerName: 'Mike Brown', paymentMethod: 'Credit Card', reference: 'TXN-003', notes: 'Wrong part ordered', storeId: 'store1' }
    ],
    evening: [
      { id: 4, type: 'sale', amount: 129.99, time: '4:15 PM', items: ['Full Service', 'Oil Change'], customerName: 'Emma Wilson', paymentMethod: 'Debit Card', reference: 'TXN-004', notes: 'Annual service', storeId: 'store3' },
      { id: 5, type: 'sale', amount: 35.50, time: '5:30 PM', items: ['Windshield Wipers'], customerName: 'Tom Davis', paymentMethod: 'Cash', reference: 'TXN-005', storeId: 'store2' }
    ]
  },
  weekly: [
    { id: 6, type: 'sale', amount: 299.99, date: '2024-03-18', items: ['Timing Belt', 'Labor'], customerName: 'James Wilson', paymentMethod: 'Credit Card', reference: 'TXN-006', notes: 'Scheduled maintenance', storeId: 'store1' },
    { id: 7, type: 'sale', amount: 149.99, date: '2024-03-17', items: ['Battery Replacement'], customerName: 'Lisa Anderson', paymentMethod: 'Debit Card', reference: 'TXN-007', storeId: 'store3' },
    { id: 8, type: 'refund', amount: -45.99, date: '2024-03-16', items: ['Oil Filter Set'], customerName: 'David Miller', paymentMethod: 'Credit Card', reference: 'TXN-008', notes: 'Customer changed mind', storeId: 'store2' }
  ],
  monthly: [
    { id: 9, type: 'sale', amount: 899.99, date: '2024-03-10', items: ['Engine Repair'], customerName: 'Robert Taylor', paymentMethod: 'Credit Card', reference: 'TXN-009', notes: 'Major engine work', storeId: 'store1' },
    { id: 10, type: 'sale', amount: 459.99, date: '2024-03-05', items: ['Transmission Service'], customerName: 'Patricia White', paymentMethod: 'Debit Card', reference: 'TXN-010', storeId: 'store2' },
    { id: 11, type: 'refund', amount: -129.99, date: '2024-03-02', items: ['Brake Service'], customerName: 'George Brown', paymentMethod: 'Credit Card', reference: 'TXN-011', notes: 'Service cancelled', storeId: 'store3' }
  ],
  yearly: [
    { id: 12, type: 'sale', amount: 2499.99, date: '2024-02-15', items: ['Major Service'], customerName: 'Kevin Lee', paymentMethod: 'Credit Card', reference: 'TXN-012', notes: 'Complete vehicle overhaul', storeId: 'store1' },
    { id: 13, type: 'sale', amount: 1899.99, date: '2024-01-20', items: ['Engine Overhaul'], customerName: 'Mary Johnson', paymentMethod: 'Bank Transfer', reference: 'TXN-013', notes: 'Engine rebuild', storeId: 'store2' },
    { id: 14, type: 'refund', amount: -299.99, date: '2024-01-05', items: ['Parts Return'], customerName: 'Steve Martin', paymentMethod: 'Credit Card', reference: 'TXN-014', notes: 'Defective parts', storeId: 'store3' }
  ]
}

// Memoize the transaction card component
const TransactionCard = memo(({ 
  transaction, 
  isExpanded, 
  onToggle 
}: {
  transaction: Transaction
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
  const [selectedPeriod, setSelectedPeriod] = useState<keyof AllTransactions>("today")
  const [timeOfDay, setTimeOfDay] = useState<DayTime>("morning")
  const [expandedTransactions, setExpandedTransactions] = useState<number[]>([])
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

  const getTransactions = useCallback(() => {
    let transactions = selectedPeriod === 'today'
      ? (timeOfDay === 'full'
        ? [...mockTransactions.today.morning, ...mockTransactions.today.evening]
        : mockTransactions.today[timeOfDay])
      : mockTransactions[selectedPeriod]

    // Filter by store if a specific store is selected
    if (selectedStore !== "all-stores") {
      transactions = transactions.filter(t => t.storeId === selectedStore)
    }

    return transactions
  }, [selectedPeriod, timeOfDay, selectedStore])

  const transactions = useMemo(() => getTransactions(), [getTransactions])

  const toggleTransaction = useCallback((id: number) => {
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
              <Select value={selectedPeriod} onValueChange={(value: keyof AllTransactions) => {
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

        {transactions && transactions.length > 0 ? (
          <div className="grid gap-4">
            {transactions.map((transaction) => (
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