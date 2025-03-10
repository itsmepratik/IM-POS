"use client"

import { useState, Suspense } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  BarChart2,
  Download,
  RefreshCcw,
  Share2,
  FileText,
  TrendingUp,
  PieChart,
  DollarSign,
  Plus,
  ChevronRight,
  Settings,
  Calendar,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useUser } from "../user-context"

const ReportCard = dynamic(() => import("./report-card"), {
  loading: () => <Skeleton className="h-[200px] w-full" />,
})

export default function ReportsClient() {
  const { currentUser } = useUser()
  const [selectedReport, setSelectedReport] = useState("sales")
  const { messages, append, isLoading } = useChat()
  const { toast } = useToast()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [dateRange, setDateRange] = useState("last30days")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  if (currentUser?.role === "staff") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  const generateReport = async () => {
    try {
      await append({
        role: "user",
        content: `Generate a detailed ${selectedReport} report for a small business. Include an executive summary, key metrics, trend analysis, and recommendations.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Desktop version
  const DesktopLayout = () => (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-[140px]"
              />
              <span>to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-[140px]"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="inventory">Inventory Report</SelectItem>
              <SelectItem value="customer">Customer Insights</SelectItem>
              <SelectItem value="financial">Financial Summary</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart2 className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4 w-full overflow-x-hidden">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <ReportCard
              title="Executive Summary"
              icon={<FileText className="h-4 w-4" />}
              content={
                messages.length > 0
                  ? messages[messages.length - 1].content
                  : "Generate a report to see the AI-powered executive summary."
              }
              isLoading={isLoading}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <ReportCard
                title="Key Metrics"
                icon={<BarChart2 className="h-4 w-4" />}
                content="Detailed breakdown of important KPIs and their changes over time."
                isLoading={isLoading}
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <ReportCard
                title="Trend Analysis"
                icon={<TrendingUp className="h-4 w-4" />}
                content="In-depth analysis of emerging trends and patterns in your business data."
                isLoading={isLoading}
              />
            </Suspense>
          </div>
        </TabsContent>
        <TabsContent value="visualizations" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <ReportCard
                title="Sales Distribution"
                icon={<PieChart className="h-4 w-4" />}
                content="Visual representation of sales distribution across product categories."
                isLoading={isLoading}
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <ReportCard
                title="Revenue Forecast"
                icon={<DollarSign className="h-4 w-4" />}
                content="AI-generated revenue forecast for the next quarter based on historical data."
                isLoading={isLoading}
              />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  // Mobile version
  const MobileLayout = () => (
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="thisMonth">This month</SelectItem>
            <SelectItem value="lastMonth">Last month</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>Report Settings</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Report</SelectItem>
                    <SelectItem value="inventory">Inventory Report</SelectItem>
                    <SelectItem value="customer">Customer Insights</SelectItem>
                    <SelectItem value="financial">Financial Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateRange === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Date Range</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-12">From:</span>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-12">To:</span>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  generateReport()
                  setIsSettingsOpen(false)
                }}
                disabled={isLoading}
              >
                Generate Report
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Content */}
      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="p-4 flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Create Your First Report</h2>
            <p className="text-sm text-muted-foreground mb-6">Generate AI-powered insights for your business</p>
            <Button onClick={() => setIsSettingsOpen(true)} className="w-full max-w-xs" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message, index) => (
              <div key={index} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">{selectedReport} Report</h3>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Actions */}
      {messages.length > 0 && (
        <div className="border-t p-4 grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full">
      <div className="hidden md:block h-full">
        <DesktopLayout />
      </div>
      <div className="md:hidden h-full">
        <MobileLayout />
      </div>
    </div>
  )
}

