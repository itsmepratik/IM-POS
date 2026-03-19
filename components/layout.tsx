"use client";

import { useRouter, usePathname } from "next/navigation";
import type React from "react";
import { useUser } from "@/lib/contexts/UserContext";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Separator } from "@/components/ui/separator";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function Layout({ children, pageTitle }: LayoutProps) {
  const { currentUser } = useUser();
  const pathname = usePathname();

  // Determine page title based on pathname if not provided
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;

    if (pathname === "/") return "Dashboard";
    if (pathname === "/pos") return "Point of Sale";
    if (pathname === "/reports") return "Reports";
    if (pathname === "/customers") return "Customers";
    if (pathname.startsWith("/inventory")) return "Inventory";
    if (pathname === "/orders") return "Orders";
    if (pathname === "/transfer") return "Transfer Stock";
    if (pathname === "/restock") return "Restock Orders";
    if (pathname === "/restock-orders") return "Restock Order History";
    if (pathname === "/purchase-orders") return "Purchase Orders";
    if (pathname === "/admins") return "Admin";

    // Extract the last part of the path and capitalize it
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }

    return "HNS Automotive";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden print:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </header>

        <div className="flex flex-1 flex-col p-2 md:p-3 overflow-hidden print:p-0 print:overflow-visible">
          <main className="flex-1 w-full overflow-auto rounded-2xl bg-white border border-gray-200 p-3 print:border-none print:m-0 print:p-0 print:rounded-none print:overflow-visible">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
