"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layout } from "@/components/layout"
import { ShoppingCart, ChevronDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/page-title"

export default function OrdersPage() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [hasMounted, setHasMounted] = useState(false)

  // Set initial state after component mounts to avoid hydration mismatch
  useEffect(() => {
    setActiveTab("all")
    setHasMounted(true)
  }, [])

  const toggleFilters = () => setIsFilterExpanded(!isFilterExpanded)

  return (
    <Layout>
      <div className="space-y-4 w-full">
        {/* Header section */}
        <PageHeader
          actions={
            <>
              <Button variant="outline" className="flex-1 sm:flex-none text-[clamp(0.8rem,3vw,0.875rem)]">
                Export
              </Button>
              <Button className="flex-1 sm:flex-none text-[clamp(0.8rem,3vw,0.875rem)]">
                Create Order
              </Button>
            </>
          }
        >
          Online Orders
        </PageHeader>

        {/* Tabs - scrollable on all screen sizes */}
        <ScrollArea className="w-full pb-2">
          {hasMounted ? (
            <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="w-max">
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-[clamp(0.8rem,3vw,0.875rem)] px-3">All</TabsTrigger>
                <TabsTrigger value="active" className="text-[clamp(0.8rem,3vw,0.875rem)] px-3">Active</TabsTrigger>
                <TabsTrigger value="scheduled" className="text-[clamp(0.8rem,3vw,0.875rem)] px-3">Scheduled</TabsTrigger>
                <TabsTrigger value="completed" className="text-[clamp(0.8rem,3vw,0.875rem)] px-3">Completed</TabsTrigger>
                <TabsTrigger value="cancelled" className="text-[clamp(0.8rem,3vw,0.875rem)] px-3">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <div className="h-9 bg-muted rounded-lg animate-pulse w-[300px]"></div>
          )}
        </ScrollArea>

        {/* Filters - responsive layout */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-[calc(100%-4.5rem)] sm:max-w-sm">
              <Input
                placeholder="Search"
                className="w-full text-[clamp(0.8rem,3vw,0.875rem)]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden whitespace-nowrap text-[clamp(0.8rem,3vw,0.875rem)]"
              onClick={toggleFilters}
            >
              Filters
              <ChevronDown className={`ml-2 h-3 w-3 transition-transform ${isFilterExpanded ? "rotate-180" : ""}`} />
            </Button>
          </div>
          <div className={`grid grid-cols-2 sm:flex flex-wrap gap-2 ${isFilterExpanded ? "" : "hidden sm:grid sm:flex"}`}>
            <Select>
              <SelectTrigger className="w-full sm:w-[clamp(120px,15vw,200px)] text-[clamp(0.8rem,3vw,0.875rem)]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-[clamp(120px,15vw,200px)] text-[clamp(0.8rem,3vw,0.875rem)]">
                <SelectValue placeholder="Type: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-[clamp(120px,15vw,200px)] text-[clamp(0.8rem,3vw,0.875rem)]">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-[clamp(120px,15vw,200px)] text-[clamp(0.8rem,3vw,0.875rem)]">
                <SelectValue placeholder="Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-[clamp(120px,15vw,200px)] text-[clamp(0.8rem,3vw,0.875rem)]">
                <SelectValue placeholder="Online Order sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty state - center on all screens */}
        <div className="flex flex-col items-center justify-center min-h-[clamp(300px,50vh,400px)] border rounded-lg p-4 md:p-8 text-center">
          <div className="w-[clamp(48px,10vw,64px)] h-[clamp(48px,10vw,64px)] bg-muted rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-[clamp(24px,5vw,32px)] h-[clamp(24px,5vw,32px)] text-muted-foreground" />
          </div>
          <h2 className="text-[clamp(1.1rem,4vw,1.25rem)] font-semibold mb-2">Online Orders</h2>
          <p className="text-muted-foreground mb-4 max-w-md text-[clamp(0.875rem,3vw,1rem)]">
            This is where you&apos;ll manage all online orders.
          </p>
        </div>
      </div>
    </Layout>
  )
}

