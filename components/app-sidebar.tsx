"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  ShoppingCart,
  Wrench,
  Users,
  BarChart2,
  RefreshCcw,
  Warehouse,
  Building,
  ArrowLeftRight,
  Package,
  Truck,
  Inbox,
  Settings,
  LogOut,
  Moon,
  Sun,
  User,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
  SidebarMenuBadge,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/lib/contexts/UserContext"
import { useNotification } from "@/lib/contexts/NotificationContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { currentUser, hasPermission, isAdmin, isLoading } = useUser()
  const { unreadCount } = useNotification()
  const { state } = useSidebar()

  const navItems = [
    {
      title: "Dashboard",
      href: "/home",
      icon: Home,
      permission: "admin.access",
      adminOnly: true,
    },
    {
      title: "POS",
      href: "/pos",
      icon: ShoppingCart,
      permission: "pos.access",
      adminOnly: false,
    },
    {
      title: "Internal Tool",
      href: "/internal-tool",
      icon: Wrench,
      permission: "admin.access",
      adminOnly: true,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: Users,
      permission: "customers.access",
      adminOnly: false,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: BarChart2,
      permission: "reports.access",
      adminOnly: true,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: RefreshCcw,
      permission: "transactions.access",
      adminOnly: false,
    },
  ]

  const inventoryItems = [
    {
      title: "Main",
      href: "/inventory/main-inventory",
      icon: Warehouse,
      permission: "inventory.access",
      adminOnly: false,
    },
    {
      title: "Branch",
      href: "/inventory/branch-inventory",
      icon: Building,
      permission: "inventory.access",
      adminOnly: false,
    },
  ]

  const orderItems = [
    {
      title: "Online Orders",
      href: "/orders",
      icon: ShoppingCart,
      permission: "admin.access",
      adminOnly: true,
    },
    {
      title: "Transfer Stock",
      href: "/transfer",
      icon: ArrowLeftRight,
      permission: "admin.access",
      adminOnly: true,
    },
    {
      title: "Transfer 2.0",
      href: "/transfer-2",
      icon: Package,
      permission: "admin.access",
      adminOnly: true,
    },
    {
      title: "Restock Orders",
      href: "/restock-orders",
      icon: Truck,
      permission: "admin.access",
      adminOnly: true,
    },
  ]

  if (isLoading) {
    return <Sidebar collapsible="icon" {...props} />
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {state === "collapsed" ? (
          <div className="flex justify-center">
            <SidebarTrigger />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <TeamSwitcher />
            <SidebarTrigger />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin()) return null
              // @ts-ignore
              if (!hasPermission(item.permission)) return null

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Inventory Management Group */}
        {/* @ts-ignore */}
        {(hasPermission("inventory.access") || isAdmin()) && (
          <SidebarGroup>
            <SidebarGroupLabel>Inventory Management</SidebarGroupLabel>
            <SidebarMenu>
              {/* Inventory Sub-menu */}
              {/* @ts-ignore */}
              {hasPermission("inventory.access") && (
                <Collapsible asChild defaultOpen={pathname.startsWith("/inventory")} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Inventory Items">
                        <Warehouse />
                        <span>Inventory</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {inventoryItems.map((item) => {
                          if (item.adminOnly && !isAdmin()) return null
                          // @ts-ignore
                          if (!hasPermission(item.permission)) return null

                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                <Link href={item.href}>
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Orders Sub-menu */}
              {isAdmin() && (
                <Collapsible asChild defaultOpen={
                  pathname === "/orders" ||
                  pathname === "/transfer" ||
                  pathname === "/transfer-2" ||
                  pathname === "/restock-orders"
                } className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Manage Orders">
                        <ShoppingCart />
                        <span>Orders</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {orderItems.map((item) => {
                          if (item.adminOnly && !isAdmin()) return null
                          // @ts-ignore
                          if (!hasPermission(item.permission)) return null

                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                <Link href={item.href}>
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
        
        {/* Notifications */}
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === "/notifications"}
                    tooltip="Notifications"
                  >
                    <Link href="/notifications">
                      <Inbox />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                          <SidebarMenuBadge className="bg-orange-500 text-white hover:text-white">
                            {unreadCount}
                          </SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function TeamSwitcher() {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
             {/* Using a simple placeholder logo similar to shadcn demo or current text */}
             <span className="font-bold">HA</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold font-wide" style={{ letterSpacing: "0px" }}>
              HNS Automotive
            </span>
            <span className="truncate text-xs">Enterprise</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavUser() {
  const { isMobile, state } = useSidebar()
  const { currentUser, signOut, isLoading } = useUser()
  const router = useRouter()
  const [darkMode, setDarkMode] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleLogout = async () => {
     if (isLoggingOut) return
     setIsLoggingOut(true)
     try {
       await signOut()
       router.replace("/login")
     } catch (error) {
       console.error("Logout error", error)
       router.replace("/login")
     } finally {
       setTimeout(() => setIsLoggingOut(false), 1000)
     }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={currentUser?.name || "User"}
              className="h-10 w-full bg-sidebar hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sidebar-foreground px-2 !shadow-none !border-none"
            >
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarImage src="/avatars/01.svg" alt={currentUser?.name || "User"} />
                <AvatarFallback className="rounded-md bg-zinc-200 text-zinc-900 text-xs shadow-sm">
                   {currentUser?.name ? currentUser.name.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                    <span className="truncate font-medium text-foreground">{currentUser?.name || "Admin User"}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{currentUser?.role || "admin"}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem onSelect={() => {}}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
             <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  toggleDarkMode()
                }}
              >
                {darkMode ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                Dark Mode
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} className="ml-auto scale-75" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut || isLoading}>
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
