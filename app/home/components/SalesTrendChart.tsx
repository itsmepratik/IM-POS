"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// Neutral color config
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--muted-foreground))", // Neutral color
  },
} satisfies ChartConfig;

interface SalesTrendChartProps {
  data: { date: string; value: number }[];
  isLoading: boolean;
  trendPercentage?: number;
}

export function SalesTrendChart({
  data,
  isLoading,
  trendPercentage,
}: SalesTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2 border-2 rounded-[16px] max-w-[90vw]">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Daily revenue over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item) => {
    // Parse date manually to avoid timezone issues with new Date(string)
    const [year, month, day] = item.date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return {
      ...item,
      formattedDate: format(dateObj, "MMM dd"),
      originalDate: item.date,
    };
  });

  const isPositive = (trendPercentage || 0) >= 0;

  return (
    <Card className="col-span-1 lg:col-span-2 border-2 rounded-[16px] max-w-[90vw]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Daily revenue over the selected period
            </CardDescription>
          </div>
          {trendPercentage !== undefined && (
            <div
              className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trendPercentage).toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={formattedData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 5)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" fill="var(--color-revenue)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `OMR ${value.toFixed(0)}`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
