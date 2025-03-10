"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Search, X } from "lucide-react"
import { useUser } from "../user-context"
import { UserModal } from "./user-modal"
import { toast } from "@/components/ui/use-toast"
import { UserCard } from "./user-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function AdminsPage() {
  const { users, deleteUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | undefined>(undefined)
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (user: (typeof users)[0]) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteUser(id)
    toast({
      title: "User deleted",
      description: "The user has been successfully deleted.",
    })
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <div className="flex items-center gap-2">
            {/* Desktop search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users"
                className="pl-8 w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Mobile search toggle */}
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setIsSearchVisible(!isSearchVisible)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Mobile search input */}
        {isSearchVisible && (
          <div className="relative sm:hidden">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setIsSearchVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Desktop table view */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>Edit user</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)}>
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden space-y-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => handleEdit(user)}
              onDelete={() => handleDelete(user.id)}
            />
          ))}
        </div>

        <UserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingUser(undefined)
          }}
          user={editingUser}
        />
      </div>
      {/* Floating Action Button for mobile */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-4 right-4 rounded-full p-0 w-14 h-14 sm:hidden"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Add User</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Add User</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Layout>
  )
}

