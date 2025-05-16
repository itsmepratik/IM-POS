"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/app/user-context";
import {
  Home,
  ClipboardList,
  RefreshCcw,
  Settings,
  ShoppingCart,
  BarChart2,
  Users,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building,
  Warehouse,
  Truck,
  User,
  LogOut,
  Bell,
  Inbox,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "@/app/notification-context";

export function Sidebar({
  className,
  onCollapsedChange,
}: {
  className?: string;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const { currentUser } = useUser();
  const { notifications } = useNotification();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // When isCollapsed changes, notify parent component if callback is provided
  React.useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  // Check if we're on mobile
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Define the nav items
  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-4 w-4" />,
      isAdmin: false,
    },
    {
      title: "POS",
      href: "/pos",
      icon: <ShoppingCart className="h-4 w-4" />,
      isAdmin: false,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: <Users className="h-4 w-4" />,
      isAdmin: false,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart2 className="h-4 w-4" />,
      isAdmin: false,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: <RefreshCcw className="h-4 w-4" />,
      isAdmin: false,
    },
  ];

  // Define the dropdown items
  const inventoryItems = [
    {
      title: "Main",
      href: "/inventory",
      icon: <Warehouse className="h-4 w-4" />,
    },
    {
      title: "Branch",
      href: "/branch-inventory",
      icon: <Building className="h-4 w-4" />,
    },
  ];

  const orderItems = [
    {
      title: "Online Orders",
      href: "/orders",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      title: "Transfer Stock",
      href: "/transfer",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      title: "Restock Orders",
      href: "/restock-orders",
      icon: <Truck className="h-4 w-4" />,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-full flex-col border-r bg-background transition-all duration-300 shadow-sm lg:w-auto",
        isCollapsed ? "lg:w-14" : "lg:w-56",
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header with logo and toggle */}
        <div
          className={cn(
            "flex h-14 items-center border-b px-3",
            isCollapsed ? "justify-center" : "justify-between px-4"
          )}
        >
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <Link href="/" className="flex-1 truncate">
                <span className="font-bold text-sm">H Automotives</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-7 w-7 rounded-full ml-1 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="h-7 w-7 rounded-full flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              // Skip admin items for non-admin users
              if (
                item.isAdmin &&
                (!currentUser || currentUser.role !== "admin")
              ) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap",
                    pathname === item.href &&
                      "bg-accent text-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Link>
              );
            })}

            {/* Inventory Accordion */}
            <Accordion
              type="single"
              collapsible
              className={cn("w-full", isCollapsed && "hidden")}
            >
              <AccordionItem value="inventory" className="border-none">
                <AccordionTrigger className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <span className="flex-shrink-0">
                      <Warehouse className="h-4 w-4" />
                    </span>
                    <span className="truncate">Inventory</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1 pt-0 px-0">
                  <div className="ml-2 space-y-1">
                    {inventoryItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap",
                          pathname === item.href &&
                            "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Inventory Icon Only (when collapsed) */}
            {isCollapsed && (
              <div className="flex justify-center py-1">
                <Link
                  href="/inventory"
                  className={cn(
                    "flex items-center justify-center rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    (pathname === "/inventory" ||
                      pathname === "/branch-inventory") &&
                      "bg-accent text-accent-foreground"
                  )}
                  title="Inventory"
                >
                  <Warehouse className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Orders Accordion */}
            <Accordion
              type="single"
              collapsible
              className={cn("w-full", isCollapsed && "hidden")}
            >
              <AccordionItem value="orders" className="border-none">
                <AccordionTrigger className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <span className="flex-shrink-0">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    <span className="truncate">Orders</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1 pt-0 px-0">
                  <div className="ml-2 space-y-1">
                    {orderItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap",
                          pathname === item.href &&
                            "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Orders Icon Only (when collapsed) */}
            {isCollapsed && (
              <div className="flex justify-center py-1">
                <Link
                  href="/orders"
                  className={cn(
                    "flex items-center justify-center rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    (pathname === "/orders" ||
                      pathname === "/transfer" ||
                      pathname === "/restock-orders") &&
                      "bg-accent text-accent-foreground"
                  )}
                  title="Orders"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom actions section */}
        <div className="mt-auto border-t p-2">
          {/* Notifications Inbox Link */}
          <Link
            href="/notifications"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap mb-2",
              pathname === "/notifications" &&
                "bg-accent text-accent-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Notifications" : undefined}
          >
            <span className="flex-shrink-0 relative">
              <Inbox className="h-4 w-4" />
              {notifications.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center bg-blue-500 text-[10px]">
                  {notifications.length}
                </Badge>
              )}
            </span>
            {!isCollapsed && <span className="truncate">Notifications</span>}
          </Link>

          {/* Profile Menu */}
          <ProfileMenu isCollapsed={isCollapsed} />
        </div>
      </div>
    </aside>
  );
}

function ProfileMenu({ isCollapsed }: { isCollapsed: boolean }) {
  const router = useRouter();
  const { currentUser } = useUser();

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  const handleLogout = () => {
    // Handle logout (modify as needed based on your auth implementation)
    localStorage.removeItem("token"); // Example - remove token
    sessionStorage.clear(); // Clear session storage
    router.push("/auth");
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src="/avatars/01.svg" alt="@username" />
                <AvatarFallback>
                  {currentUser?.name ? currentUser.name.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[12.5rem] rounded-xl border p-2"
            align="end"
            side="right"
            forceMount
          >
            <DropdownMenuItem className="rounded-lg py-2">
              <User className="mr-2 h-5 w-5 stroke-[1.5]" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg py-2"
              onSelect={handleSettingsClick}
            >
              <Settings className="mr-2 h-5 w-5 stroke-[1.5]" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              className="rounded-lg py-2"
              onSelect={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5 stroke-[1.5]" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="p-2 h-auto w-full flex items-center gap-2 justify-start rounded-md hover:bg-accent transition-colors duration-200"
          >
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarImage src="/avatars/01.svg" alt="@username" />
              <AvatarFallback>
                {currentUser?.name ? currentUser.name.charAt(0) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="grid text-left">
              <span className="text-xs font-medium truncate max-w-[130px]">
                {currentUser?.name || "User"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {currentUser?.role || "User"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[12.5rem] rounded-xl border p-2"
          align="end"
          side="top"
          forceMount
        >
          <DropdownMenuItem className="rounded-lg py-2">
            <User className="mr-2 h-5 w-5 stroke-[1.5]" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-lg py-2"
            onSelect={handleSettingsClick}
          >
            <Settings className="mr-2 h-5 w-5 stroke-[1.5]" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem className="rounded-lg py-2" onSelect={handleLogout}>
            <LogOut className="mr-2 h-5 w-5 stroke-[1.5]" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
