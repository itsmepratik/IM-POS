"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  Home,
  Package,
  ClipboardList,
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
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/app/user-context"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  const [inventoryOpen, setInventoryOpen] = React.useState(false)
  const [ordersOpen, setOrdersOpen] = React.useState(false)
  const { currentUser } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

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
      title: "Reports",
      href: "/reports",
      icon: <BarChart2 className="h-4 w-4" />,
      isAdmin: false,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: <Users className="h-4 w-4" />,
      isAdmin: false,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: <RefreshCcw className="h-4 w-4" />,
      isAdmin: false,
    }
  ]

  const showAdminItems = mounted && currentUser && currentUser.role === "admin"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className={cn("h-9 w-9 rounded-full border-muted-foreground/20", className)}
        onClick={() => setOpen(true)}
      >
          <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
        </Button>
      <SheetContent side="left" className="w-[300px] p-0 rounded-tr-lg rounded-br-lg">
        <DialogPrimitive.Title className="sr-only">
          Navigation Menu
        </DialogPrimitive.Title>
        <div className="flex h-full flex-col overflow-y-auto rounded-tr-lg rounded-br-lg">
        <SheetHeader className="border-b p-4 rounded-tr-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold">H Automotives</span>
            </div>
        </SheetHeader>
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="grid gap-1 px-2">
              {navItems.map((item) => {
                if (item.isAdmin && !showAdminItems) {
                  return null
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      mounted && pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                )
              })}
              
              {/* Orders Dropdown */}
          <div className="space-y-1">
                <button
                  onClick={() => setOrdersOpen(!ordersOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    mounted && (pathname === "/orders" || pathname === "/transfer" || pathname === "/restock-orders") ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-4 w-4" />
                    <span>Orders</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", ordersOpen && "rotate-180")} />
                </button>
                
                {ordersOpen && (
                  <div className="ml-6 space-y-1">
                    <Link 
                      href="/orders" 
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        mounted && pathname === "/orders" ? "bg-accent text-accent-foreground" : "transparent"
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
                        mounted && pathname === "/transfer" ? "bg-accent text-accent-foreground" : "transparent"
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
                        mounted && pathname === "/restock-orders" ? "bg-accent text-accent-foreground" : "transparent"
                      )}
                    >
                      <Truck className="h-4 w-4" />
                      <span>Restock Orders</span>
                    </Link>
                  </div>
                )}
          </div>

              {/* Inventory Dropdown */}
          <div className="space-y-1">
                <button
                  onClick={() => setInventoryOpen(!inventoryOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    mounted && (pathname === "/inventory" || pathname === "/inventory/branch") ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4" />
                    <span>Inventory</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", inventoryOpen && "rotate-180")} />
                </button>
                
                {inventoryOpen && (
                  <div className="ml-6 space-y-1">
                    <Link 
                      href="/inventory" 
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        mounted && pathname === "/inventory" ? "bg-accent text-accent-foreground" : "transparent"
                      )}
                    >
                      <Warehouse className="h-4 w-4" />
                      <span>Main</span>
                    </Link>
                    <Link 
                      href="/inventory/branch" 
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        mounted && pathname === "/inventory/branch" ? "bg-accent text-accent-foreground" : "transparent"
                      )}
                    >
                      <Building className="h-4 w-4" />
                      <span>Branch</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src="/avatars/01.png" alt="@username" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span>{mounted && currentUser ? currentUser.name || "User" : "User"}</span>
                    <span className="text-xs text-muted-foreground">
                      {mounted && currentUser ? currentUser.email || "user@example.com" : "user@example.com"}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[90%] sm:w-52 min-w-[13rem] border-2">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4 stroke-[1.5]" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4 stroke-[1.5]" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/auth")}>
                  <LogOut className="mr-2 h-4 w-4 stroke-[1.5]" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

