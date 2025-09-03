"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  ClipboardList,
  RefreshCcw,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  User,
  BarChart2,
  LogOut,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type React from "react";
import { useUser } from "@/app/user-context";
import { Sidebar } from "./new-sidebar";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function Layout({ children, pageTitle }: LayoutProps) {
  const { currentUser } = useUser();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    if (pathname === "/admins") return "Admin";

    // Extract the last part of the path and capitalize it
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }

    return "HNS Automotive";
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle sidebar collapse state changes
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex min-h-screen w-full bg-background overflow-auto">
      {/* Desktop Sidebar - only show on tablets and above */}
      <Sidebar
        className="hidden lg:flex"
        onCollapsedChange={handleSidebarCollapse}
      />

      {/* Mobile header - show on mobile screens only */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 flex items-center justify-between px-4">
        <div className="flex items-center">
          <MobileNav className="mr-2" />
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold truncate max-w-[60%] text-center">
          {getPageTitle()}
        </h1>
        <div className="flex items-center">
          {/* Placeholder for potential actions */}
        </div>
      </div>

      {/* Main content - push to the side based on sidebar state */}
      <div
        className={cn(
          "flex-1 w-full flex flex-col mt-16 lg:mt-0 overflow-auto",
          sidebarCollapsed ? "lg:ml-14" : "lg:ml-56"
        )}
        style={{
          transition: "margin-left 300ms ease-in-out",
          willChange: "margin-left",
        }}
      >
        <main className="flex-1 w-full p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
  className?: string;
}

function NavItem({ href, icon, children, collapsed, className }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2",
        className
      )}
      title={collapsed ? String(children) : undefined}
    >
      {icon}
      {!collapsed && children}
    </Link>
  );
}

function ProfileMenu() {
  const router = useRouter();
  const { signOut } = useUser();

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: still redirect even if logout fails
      router.push("/login");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.svg" alt="@username" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 max-sm:w-64 rounded-xl border-2 p-2"
        align="end"
        forceMount
      >
        <DropdownMenuItem className="rounded-lg py-2">
          <User className="mr-2 h-5 w-5 stroke-[2]" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-lg py-2"
          onSelect={handleSettingsClick}
        >
          <Settings className="mr-2 h-5 w-5 stroke-[2]" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem className="rounded-lg py-2" onSelect={handleLogout}>
          <LogOut className="mr-2 h-5 w-5 stroke-[2]" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
