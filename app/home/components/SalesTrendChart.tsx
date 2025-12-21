"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

interface SalesTrendChartProps {
  data: { date: string; value: number }[]
  isLoading: boolean
  trendPercentage?: number
}

export function SalesTrendChart({ data, isLoading, trendPercentage }: SalesTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2 border-2 rounded-[33px]">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md" />
        </CardContent>
      </Card>
    )
  }

  const formattedData = data.map(item => {
    // Parse date manually to avoid timezone issues with new Date(string)
    const [year, month, day] = item.date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    return {
      ...item,
      formattedDate: format(dateObj, "MMM dd"),
      originalDate: item.date
    }
  })

  const isPositive = (trendPercentage || 0) >= 0

  return (
    <Card className="col-span-1 lg:col-span-2 border-2 rounded-[33px]">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
            </div>
            {trendPercentage !== undefined && (
                <div className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                    {Math.abs(trendPercentage).toFixed(1)}%
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E30600" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#E30600" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={10}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `OMR ${value}`} 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                width={80}
              />
              <Tooltip 
                cursor={{ stroke: '#E30600', strokeWidth: 1, strokeDasharray: '5 5' }}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
                        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                        <p className="text-lg font-bold text-gray-900">
                            OMR {Number(payload[0].value).toFixed(2)}
                        </p>
                        </div>
                    )
                    }
                    return null
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#E30600" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#E30600' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
