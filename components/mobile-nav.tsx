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
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, type Permission } from "@/lib/contexts/UserContext";
import { useNotification } from "@/lib/contexts/NotificationContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [inventoryOpen, setInventoryOpen] = React.useState(false);
  const [ordersOpen, setOrdersOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { currentUser, signOut, hasPermission } = useUser();
  const { notifications, unreadCount } = useNotification();
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
      href: "/home",
      icon: <Home className="h-4 w-4" />,
      isAdmin: true,
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
      title: "Internal Tool",
      href: "/internal-tool",
      icon: <Wrench className="h-4 w-4" />,
      isAdmin: true,
      permission: "admin.access" as const,
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
      isAdmin: true,
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

  const visibleNavItems = navItems.filter((item) => {
    if (!mounted || !currentUser) return false;

    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }

    if (item.isAdmin && currentUser.role !== "admin") {
      return false;
    }

    return true;
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    console.log("🚀 MOBILE LOGOUT BUTTON CLICKED - handleLogout called");
    if (isLoggingOut) {
      console.log("⏸️ Already logging out, ignoring...");
      return;
    }

    console.log("🔄 Setting isLoggingOut to true");
    setIsLoggingOut(true);
    setOpen(false);

    try {
      console.log("📤 Starting logout process - calling signOut()...");
      await signOut();
      console.log("✅ Sign out completed, navigating to login...");

      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("🔄 Calling router.replace('/login')");
      router.replace("/login");

      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          console.log(
            "⚠️ Router didn't navigate, forcing window.location.href..."
          );
          window.location.href = "/login";
        } else {
          console.log("✅ Successfully navigated to /login");
        }
      }, 500);
    } catch (error) {
      console.error("❌ Mobile logout error:", error);
      router.replace("/login");
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 500);
    } finally {
      setTimeout(() => setIsLoggingOut(false), 1000);
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
                  fontWeight: 700,
                  color: "#000000",
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
                      ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-muted-foreground/30"
                      : "transparent"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}

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
                            ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-muted-foreground/30"
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
                            ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-muted-foreground/30"
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
            </nav>
          </div>
          <div className="border-t p-4">
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
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center bg-orange-500 text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </span>
                  <span>Notifications</span>
                </Link>
              )}

            <div className="relative">
              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 space-y-1 rounded-xl border-2 bg-background p-2 shadow-lg z-50">
                  <button
                    onClick={() => {
                      console.log("🔵 Profile clicked!");
                      setProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <User className="h-5 w-5 stroke-[2]" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      console.log("🔵 Settings clicked!");
                      setProfileMenuOpen(false);
                      setOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="h-5 w-5 stroke-[2]" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      console.log("🔵 Dark Mode clicked!");
                      toggleDarkMode();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="h-5 w-5 stroke-[2]" />
                      ) : (
                        <Sun className="h-5 w-5 stroke-[2]" />
                      )}
                      <span>Dark Mode</span>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={(checked) => {
                        console.log("🔵 Switch toggled:", checked);
                        setDarkMode(checked);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </button>

                  <div className="h-[2px] bg-muted my-2" />

                  <button
                    onClick={() => {
                      console.log("🔵 Logout clicked!");
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <LogOut className="h-5 w-5 stroke-[2]" />
                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  console.log("🔵 Profile menu toggle clicked!");
                  setProfileMenuOpen(!profileMenuOpen);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.svg" alt="@username" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm flex-1">
                  <span className="font-medium">
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
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    profileMenuOpen && "rotate-180"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
