"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Home,
  RefreshCcw,
  Settings,
  ShoppingCart,
  BarChart2,
  Users,
  ArrowLeftRight,
  User,
  LogOut,
  ChevronDown,
  Building,
  Warehouse,
  Truck,
  Inbox,
  Moon,
  Sun,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, type Permission } from "@/app/user-context";
import { useNotification } from "@/app/notification-context";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [inventoryOpen, setInventoryOpen] = React.useState(false);
  const [ordersOpen, setOrdersOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { currentUser, signOut, hasPermission } = useUser();
  const { notifications } = useNotification();
  const router = useRouter();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      href: "/home", // Changed from "/" to "/home" for admin dashboard
      icon: <Home className="h-4 w-4" />,
      isAdmin: true, // Dashboard is admin-only
      permission: "admin.access" as const,
    },
    {
      title: "POS",
      href: "/pos",
      icon: <ShoppingCart className="h-4 w-4" />,
      isAdmin: false,
      permission: "pos.access" as const,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: <Users className="h-4 w-4" />,
      isAdmin: false,
      permission: "customers.access" as const,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart2 className="h-4 w-4" />,
      isAdmin: true, // Reports are admin-only
      permission: "reports.access" as const,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: <RefreshCcw className="h-4 w-4" />,
      isAdmin: false,
      permission: "transactions.access" as const,
    },
  ];

  const showAdminItems = mounted && currentUser && currentUser.role === "admin";

  // Filter navigation items based on permissions
  const visibleNavItems = navItems.filter((item) => {
    if (!mounted || !currentUser) return false;

    // Check if user has the required permission
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }

    // Additional admin check for explicitly admin items
    if (item.isAdmin && currentUser.role !== "admin") {
      return false;
    }

    return true;
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // No actual functionality as per requirements
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double clicks

    setIsLoggingOut(true);
    setOpen(false); // Close the mobile nav sheet

    try {
      await signOut();
      // Use replace instead of push to avoid back navigation issues
      router.replace("/login");
    } catch (error) {
      console.error("Mobile logout error:", error);
      // Still redirect even if logout fails to prevent stuck state
      router.replace("/login");
    } finally {
      // Reset after a delay to prevent immediate re-clicks
      setTimeout(() => setIsLoggingOut(false), 2000);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-full border-muted-foreground/20",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <SheetContent
        side="left"
        className="w-[300px] p-0 rounded-tr-lg rounded-br-lg"
      >
        <DialogPrimitive.Title className="sr-only">
          Navigation Menu
        </DialogPrimitive.Title>
        <div className="flex h-full flex-col overflow-y-auto rounded-tr-lg rounded-br-lg">
          <SheetHeader className="border-b p-4 rounded-tr-lg">
            <div className="flex items-center gap-2">
              <span
                className="text-base font-wide"
                style={{
                  fontWeight: 750,
                  color: "#6e6a6a",
                  letterSpacing: "0px",
                }}
              >
                HNS Automotive
              </span>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="grid gap-1 px-2">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    mounted && pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "transparent"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}

              {/* Orders Dropdown - Only show for admin users */}
              {showAdminItems && (
                <div className="space-y-1">
                  <button
                    onClick={() => setOrdersOpen(!ordersOpen)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      mounted &&
                        (pathname === "/orders" ||
                          pathname === "/transfer" ||
                          pathname === "/restock-orders")
                        ? "bg-accent text-accent-foreground"
                        : "transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Orders</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        ordersOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {ordersOpen && (
                    <div className="ml-6 space-y-1">
                      <Link
                        href="/orders"
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          mounted && pathname === "/orders"
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Online Orders</span>
                      </Link>
                      <Link
                        href="/transfer"
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          mounted && pathname === "/transfer"
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        <span>Transfers</span>
                      </Link>
                      <Link
                        href="/restock-orders"
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          mounted && pathname === "/restock-orders"
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <Truck className="h-4 w-4" />
                        <span>Restock Orders</span>
                      </Link>
                      <Link
                        href="/transfer-2"
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          mounted && pathname === "/transfer-2"
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <Package className="h-4 w-4" />
                        <span>Transfer 2.0</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Dropdown - Show if user has inventory access */}
              {mounted && currentUser && hasPermission("inventory.access") && (
                <div className="space-y-1">
                  <button
                    onClick={() => setInventoryOpen(!inventoryOpen)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      mounted && pathname.startsWith("/inventory")
                        ? "bg-accent text-accent-foreground"
                        : "transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Warehouse className="h-4 w-4" />
                      <span>Inventory</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        inventoryOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {inventoryOpen && (
                    <div className="ml-6 space-y-1">
                      <Link
                        href="/inventory/main-inventory"
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          mounted && pathname === "/inventory/main-inventory"
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <Warehouse className="h-4 w-4" />
                        <span>Main</span>
                      </Link>
                      <Link
                        href="/inventory/branch-inventory"
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          mounted && pathname === "/inventory/branch-inventory"
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <Building className="h-4 w-4" />
                        <span>Branch</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>
          <div className="border-t p-4">
            {/* Notifications Inbox - Show if user has notifications access */}
            {mounted &&
              currentUser &&
              hasPermission("notifications.access") && (
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground mb-2",
                    mounted && pathname === "/notifications"
                      ? "bg-accent text-accent-foreground"
                      : "transparent"
                  )}
                >
                  <span className="relative">
                    <Inbox className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center bg-blue-500 text-[10px]">
                        {notifications.length}
                      </Badge>
                    )}
                  </span>
                  <span>Notifications</span>
                </Link>
              )}

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200"
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src="/avatars/01.svg" alt="@username" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span>
                      {mounted && currentUser
                        ? currentUser.name || "User"
                        : "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {mounted && currentUser
                        ? currentUser.email || "user@example.com"
                        : "user@example.com"}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[15.5rem] max-w-full sm:w-[280px] rounded-xl border-2 p-2"
                align="end"
                side="top"
                forceMount
              >
                <DropdownMenuItem className="rounded-lg py-2">
                  <User className="mr-2 h-5 w-5 stroke-[2]" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg py-2"
                  onSelect={() => router.push("/settings")}
                >
                  <Settings className="mr-2 h-5 w-5 stroke-[2]" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg py-2 flex items-center justify-between"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleDarkMode();
                  }}
                >
                  <div className="flex items-center">
                    {darkMode ? (
                      <Moon className="mr-2 h-5 w-5 stroke-[2]" />
                    ) : (
                      <Sun className="mr-2 h-5 w-5 stroke-[2]" />
                    )}
                    <span>Dark Mode</span>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  className="rounded-lg py-2"
                  onSelect={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-5 w-5 stroke-[2]" />
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
