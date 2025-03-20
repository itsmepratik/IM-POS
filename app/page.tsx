"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { CreditCard, Banknote, Wallet, ArrowUpRight } from "lucide-react"

// Add cache configuration
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
export const fetchCache = 'force-cache'

// Mock payment details data
const paymentDetailsData = {
  "Card": {
    title: "Card Payments",
    description: "Breakdown of all card payments",
    icon: CreditCard,
    transactions: [
      { id: "tx-001", date: "2023-12-31", amount: "OMR 2,345.67", method: "Visa" },
      { id: "tx-002", date: "2023-12-31", amount: "OMR 1,987.54", method: "Mastercard" },
      { id: "tx-003", date: "2023-12-30", amount: "OMR 1,456.78", method: "Amex" },
      { id: "tx-004", date: "2023-12-30", amount: "OMR 2,876.45", method: "Visa" },
      { id: "tx-005", date: "2023-12-29", amount: "OMR 1,210.10", method: "Mastercard" },
      { id: "tx-006", date: "2023-12-29", amount: "OMR 1,845.22", method: "Visa" },
      { id: "tx-007", date: "2023-12-28", amount: "OMR 2,112.55", method: "Mastercard" },
      { id: "tx-008", date: "2023-12-28", amount: "OMR 1,678.90", method: "Visa" },
      { id: "tx-009", date: "2023-12-27", amount: "OMR 3,421.30", method: "Amex" },
      { id: "tx-010", date: "2023-12-27", amount: "OMR 1,932.18", method: "Visa" },
    ],
    stats: [
      { label: "Average transaction", value: "OMR 1,975.31" },
      { label: "Most common card", value: "Visa (42%)" },
      { label: "Growth rate", value: "+12.5% (monthly)" },
    ]
  },
  "Cash": {
    title: "Cash Payments",
    description: "Breakdown of all cash payments",
    icon: Banknote,
    transactions: [
      { id: "tx-101", date: "2023-12-31", amount: "OMR 567.89", method: "Cash" },
      { id: "tx-102", date: "2023-12-31", amount: "OMR 345.67", method: "Cash" },
      { id: "tx-103", date: "2023-12-30", amount: "OMR 789.12", method: "Cash" },
      { id: "tx-104", date: "2023-12-29", amount: "OMR 432.10", method: "Cash" },
      { id: "tx-105", date: "2023-12-29", amount: "OMR 210.89", method: "Cash" },
      { id: "tx-106", date: "2023-12-28", amount: "OMR 348.72", method: "Cash" },
      { id: "tx-107", date: "2023-12-28", amount: "OMR 567.43", method: "Cash" },
      { id: "tx-108", date: "2023-12-27", amount: "OMR 231.18", method: "Cash" },
      { id: "tx-109", date: "2023-12-27", amount: "OMR 542.87", method: "Cash" },
      { id: "tx-110", date: "2023-12-26", amount: "OMR 329.65", method: "Cash" },
    ],
    stats: [
      { label: "Average transaction", value: "OMR 469.13" },
      { label: "Peak time", value: "12pm - 2pm" },
      { label: "Growth rate", value: "-3.2% (monthly)" },
    ]
  },
  "Other": {
    title: "Other Payment Methods",
    description: "Breakdown of alternative payment methods",
    icon: Wallet,
    transactions: [
      { id: "tx-201", date: "2023-12-31", amount: "OMR 45.67", method: "Mobile Pay" },
      { id: "tx-202", date: "2023-12-30", amount: "OMR 32.45", method: "Gift Card" },
      { id: "tx-203", date: "2023-12-29", amount: "OMR 25.33", method: "Store Credit" },
      { id: "tx-204", date: "2023-12-28", amount: "OMR 20.00", method: "Mobile Pay" },
      { id: "tx-205", date: "2023-12-28", amount: "OMR 15.75", method: "Mobile Pay" },
      { id: "tx-206", date: "2023-12-27", amount: "OMR 30.50", method: "Gift Card" },
      { id: "tx-207", date: "2023-12-27", amount: "OMR 42.18", method: "Mobile Pay" },
      { id: "tx-208", date: "2023-12-26", amount: "OMR 22.95", method: "Store Credit" },
      { id: "tx-209", date: "2023-12-26", amount: "OMR 38.42", method: "Mobile Pay" },
      { id: "tx-210", date: "2023-12-25", amount: "OMR 28.67", method: "Gift Card" },
    ],
    stats: [
      { label: "Average transaction", value: "OMR 30.86" },
      { label: "Most common method", value: "Mobile Pay (65%)" },
      { label: "Growth rate", value: "+28.7% (monthly)" },
    ]
  }
}

export default function HomePage() {
  const [selectedStore, setSelectedStore] = useState("store1")

  return (
    <Layout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm mb-2">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store1">Store 1</SelectItem>
                  <SelectItem value="store2">Store 2</SelectItem>
                  <SelectItem value="store3">Store 3</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">Date: 31 Dec 2024</span>
            </div>
            <h1 className="text-2xl font-semibold">Welcome back.</h1>
          </div>
          <Button variant="ghost" className="self-start">
            Edit
          </Button>
        </div>

        <div className="grid gap-6">
          <section>
            <h2 className="text-lg font-semibold mb-4">Key metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard 
                title="Total Revenue"
                title="Net Sales" 
                value="OMR 12,345.67" 
                comparison="+15.2% from last week"
                link="/sales-info" 
              />
              <MetricCard 
                title="Net Profits" 
                value="OMR 4,567.89" 
                comparison="+18.5% from last week"
                link="/sales-info" 
              />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Payment types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PaymentType label="Card" amount="OMR 9,876.54" percentage={80} color="bg-blue-500" />
                  <PaymentType label="Cash" amount="OMR 2,345.67" percentage={19} color="bg-green-500" />
                  <PaymentType label="Other" amount="OMR 123.45" percentage={1} color="bg-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Top selling items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Product A", sales: 45, revenue: "OMR 1,234.56" },
                    { name: "Service B", sales: 32, revenue: "OMR 987.65" },
                    { name: "Product C", sales: 28, revenue: "OMR 876.54" },
                    { name: "Service D", sales: 21, revenue: "OMR 765.43" },
                    { name: "Product E", sales: 18, revenue: "OMR 654.32" },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="truncate mr-2">{item.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{item.sales} sales</span>
                      <span className="whitespace-nowrap">{item.revenue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Layout>
  )
}

interface MetricCardProps {
  title: string
  value: string
  comparison: string
  link?: string
}

function MetricCard({ title, value, comparison, link }: MetricCardProps) {
  return (
    <Card className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="text-2xl font-bold truncate">{value}</div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-muted-foreground truncate">{comparison}</div>
          {link && (
            <a href={link} className="text-sm text-blue-500 hover:text-blue-700 hover:underline">
              More details
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface PaymentTypeProps {
  label: string
  amount: string
  percentage: number
  color: string
}

function PaymentType({ label, amount, percentage, color }: PaymentTypeProps) {
  const paymentDetails = paymentDetailsData[label as keyof typeof paymentDetailsData]
  const Icon = paymentDetails?.icon || Wallet

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="truncate mr-2">{label}</span>
        <span className="whitespace-nowrap">{amount}</span>
      </div>
      <Progress value={percentage} className={color} />
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{percentage}%</div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-blue-500 hover:text-blue-700">
              <span className="mr-1">More details</span>
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95%] sm:max-w-[625px] rounded-2xl overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {paymentDetails?.title}
              </DialogTitle>
              <DialogDescription>
                {paymentDetails?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="rounded-xl border overflow-hidden shadow-md">
              <div className="overflow-x-auto rounded-xl">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table className="rounded-xl overflow-hidden">
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow className="bg-muted/50">
                        <TableHead className="whitespace-nowrap rounded-tl-xl">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                        <TableHead className="whitespace-nowrap rounded-tr-xl">Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentDetails?.transactions.map((tx, index) => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>{tx.amount}</TableCell>
                          <TableCell>{tx.method}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

