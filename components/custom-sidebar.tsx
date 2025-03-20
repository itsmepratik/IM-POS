"use client"

import * as React from "react"
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building,
  Warehouse,
  Truck,
  User,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/app/user-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Define the type for nav items
type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  isAdmin: boolean;
  hideMobile?: boolean;
}

export function CustomSidebar({ className }: { className?: string }) {
  const { currentUser } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const { open, setOpen } = useSidebar()
  const [inventoryOpen, setInventoryOpen] = React.useState(false)
  const [ordersOpen, setOrdersOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  // Check if we're on mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navItems: NavItem[] = [
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
      title: "Transactions",
      href: "/transactions",
      icon: <RefreshCcw className="h-4 w-4" />,
      isAdmin: false,
    }
  ]

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon" 
      className={cn("border-r rounded-tr-xl rounded-br-xl overflow-hidden", className)} 
      aria-label="Sidebar"
    >
      <style jsx global>{`
        [data-sidebar="sidebar"] {
          border-top-right-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }
      `}</style>
      <SidebarHeader className={cn("px-5 py-3", !open && "flex items-center justify-center")}>
        {open ? (
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-1">
              <span className="font-bold">
                H Automotives
              </span>
            </Link>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full border-muted-foreground/20 ml-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setOpen(true)}
              className="h-8 w-8 rounded-full border-muted-foreground/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu>
          {navItems.map((item) => {
            // Skip admin items for non-admin users
            if (item.isAdmin && (!currentUser || currentUser.role !== "admin")) {
              return null
            }

            // Hide items marked with hideMobile on mobile devices
            if (item.hideMobile && isMobile) {
              return null
            }

            return (
              <SidebarMenuItem key={item.href} className="my-0.5">
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "w-full pl-2",
                    pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <span className="mr-2 inline-flex">{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          
          {/* Orders Dropdown */}
          <SidebarMenuItem className="my-0.5">
            <div className="w-full">
              <button
                onClick={() => setOrdersOpen(!ordersOpen)}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  (pathname === "/orders" || pathname === "/transfer" || pathname === "/restock-orders") && "bg-accent text-accent-foreground"
                )}
              >
                <span className="mr-2 inline-flex"><ClipboardList className="h-4 w-4" /></span>
                <span className="flex-1 text-left">Orders</span>
                {open && <ChevronDown className={cn("h-4 w-4 transition-transform", ordersOpen && "rotate-180")} />}
              </button>
              
              {ordersOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  <Link 
                    href="/orders" 
                    className={cn(
                      "flex items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === "/orders" && "bg-accent text-accent-foreground"
                    )}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>Online Orders</span>
                  </Link>
                  <Link 
                    href="/transfer" 
                    className={cn(
                      "flex items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === "/transfer" && "bg-accent text-accent-foreground"
                    )}
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    <span>Transfers</span>
                  </Link>
                  <Link 
                    href="/restock-orders" 
                    className={cn(
                      "flex items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === "/restock-orders" && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    <span>Restock Orders</span>
                  </Link>
                </div>
              )}
            </div>
          </SidebarMenuItem>
          
          {/* Inventory Dropdown */}
          <SidebarMenuItem className="my-0.5">
            <div className="w-full">
              <button
                onClick={() => setInventoryOpen(!inventoryOpen)}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  (pathname === "/inventory" || pathname === "/inventory/branch") && "bg-accent text-accent-foreground"
                )}
              >
                <span className="mr-2 inline-flex"><Package className="h-4 w-4" /></span>
                <span className="flex-1 text-left">Inventory</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", inventoryOpen && "rotate-180")} />
              </button>
              
              {inventoryOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  <Link 
                    href="/inventory" 
                    className={cn(
                      "flex items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === "/inventory" && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Warehouse className="mr-2 h-4 w-4" />
                    <span>Main</span>
                  </Link>
                  <Link 
                    href="/inventory/branch" 
                    className={cn(
                      "flex items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === "/inventory/branch" && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Building className="mr-2 h-4 w-4" />
                    <span>Branch</span>
                  </Link>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="px-2">
        {open ? (
          <ProfileMenu />
        ) : (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-4 py-3 h-auto w-auto">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/01.png" alt="@username" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[90%] sm:w-52 min-w-[13rem] border-2" align="end" forceMount>
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
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

function ProfileMenu() {
  const router = useRouter()
  const { open } = useSidebar()

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleLogout = () => {
    router.push("/auth")
  }

  if (!open) {
    return (
      <div className="px-2 py-4 flex justify-center">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/avatars/01.png" alt="@username" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors hover:bg-accent">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/01.png" alt="@username" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden text-left">
            <div className="font-medium">User</div>
            <div className="truncate text-xs text-muted-foreground">
              user@example.com
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[90%] sm:w-52 min-w-[13rem] border-2" align="end" forceMount>
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4 stroke-[1.5]" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSettingsClick}>
          <Settings className="mr-2 h-4 w-4 stroke-[1.5]" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4 stroke-[1.5]" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 