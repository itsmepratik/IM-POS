"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, ArrowUpRight } from "lucide-react";
import { useDashboardData } from "./hooks/useDashboardData";
import { usePaymentTypes } from "./hooks/usePaymentTypes";
import { format } from "date-fns";
import { BranchProvider } from "@/app/branch-context";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/app/user-context";

interface Product {
  id: number;
  name: string;
  price: number;
  category: "Filters" | "Parts" | "Additives";
  brand?: string; // Optional
  type?: string; // Optional
}

export default function HomePage() {
  return (
    <BranchProvider>
      <HomePageContent />
    </BranchProvider>
  );
}

function HomePageContent() {
  // Use null as initial state to avoid hydration mismatch
  const [branchSelection, setBranchSelection] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { currentUser } = useUser();

  // Set initial state after component mounts
  useEffect(() => {
    setBranchSelection("all");
    setHasMounted(true);
  }, []);

  const { sales, profit, payments, lastUpdated, isLoading } =
    useDashboardData();

  usePaymentTypes();

  // Get user's first name for display
  const firstName = currentUser?.name?.split(" ")[0] || "User";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {hasMounted ? (
                <Select
                  value={branchSelection || undefined}
                  onValueChange={setBranchSelection}
                >
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    <SelectItem value="main">Main (Sanaya)</SelectItem>
                    <SelectItem value="branch1">Hafith</SelectItem>
                    <SelectItem value="branch2">Abu-Dhurus</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-8 w-[150px] rounded-md border bg-transparent px-3 py-2 text-sm animate-pulse" />
              )}
              <span className="text-xs text-muted-foreground">
                {lastUpdated
                  ? `Date: ${format(lastUpdated, "dd MMM yyyy")}`
                  : "Loading..."}
              </span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-baseline gap-2"
            >
              <motion.h1
                className="text-2xl font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Welcome back,
              </motion.h1>
              <motion.span
                className="text-2xl font-bold bg-gradient-to-r from-[#E30600] to-[#a30f0a] text-transparent bg-clip-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {firstName}.
              </motion.span>
            </motion.div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-3">Key metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="Total Revenue"
                value={
                  isLoading
                    ? "Loading..."
                    : `OMR ${sales.totalSales.toFixed(2)}`
                }
                comparison={
                  isLoading
                    ? "-"
                    : `${sales.changePercentage.toFixed(1)}% from last period`
                }
                link="/sales-info"
              />
              <MetricCard
                title="Net Profits"
                value={
                  isLoading
                    ? "Loading..."
                    : `OMR ${profit.grossProfit.toFixed(2)}`
                }
                comparison={
                  isLoading
                    ? "-"
                    : `${
                        isNaN(profit.profitChangePercentage)
                          ? "0"
                          : profit.profitChangePercentage.toFixed(1)
                      }% from last period`
                }
                link="/sales-info"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Payment types</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 py-2">
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.byPaymentMethod
                      .slice(0, 3)
                      .map((payment, index) => (
                        <PaymentType
                          key={payment.method}
                          label={payment.method}
                          amount={`OMR ${payment.amount.toFixed(2)}`}
                          percentage={payment.percentage}
                          color={
                            index === 0
                              ? "bg-blue-500"
                              : index === 1
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Top selling items</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 py-2">
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sales.topProducts.slice(0, 5).map((product, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center w-full"
                      >
                        <span className="truncate w-[45%]">{product.name}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {product.units} sales
                        </span>
                        <span className="text-sm whitespace-nowrap text-right">
                          OMR {product.revenue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Layout>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  comparison: string;
  link?: string;
}

function MetricCard({ title, value, comparison, link }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: "#886e6e" }}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{comparison}</p>
        {link && (
          <div className="mt-3">
            <Button variant="ghost" className="h-8 px-2 text-xs" asChild>
              <Link href={link}>
                <span className="flex items-center">
                  View details
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PaymentTypeProps {
  label: string;
  amount: string;
  percentage: number;
  color: string;
}

function PaymentType({ label, amount, percentage, color }: PaymentTypeProps) {
  const { paymentDetailsData } = usePaymentTypes();
  const paymentDetails =
    paymentDetailsData[label as keyof typeof paymentDetailsData];
  const Icon = paymentDetails?.icon || Wallet;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{amount}</span>
      </div>
      <Progress value={percentage} className={`h-2 [&>div]:${color}`} />
    </div>
  );
}
