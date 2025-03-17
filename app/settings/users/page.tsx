"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { PageHeader } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Users, User, Mail, Lock, Shield } from "lucide-react"
import { useUser } from "../../user-context"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// User type definition
interface UserType {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  avatar?: string
  lastActive?: string
}

// Mock user data
const mockUsers: UserType[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    lastActive: "2023-03-15T10:30:00Z"
  },
  {
    id: "2",
    name: "Store Manager",
    email: "manager@example.com",
    role: "manager",
    lastActive: "2023-03-15T09:45:00Z"
  },
  {
    id: "3",
    name: "Staff Member",
    email: "staff@example.com",
    role: "staff",
    lastActive: "2023-03-15T08:15:00Z"
  }
]

function UserForm({ user, onSubmit, onCancel }: { 
  user?: UserType, 
  onSubmit: (user: Omit<UserType, "id" | "lastActive">) => void,
  onCancel: () => void
}) {
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [role, setRole] = useState<"admin" | "manager" | "staff">(user?.role || "staff")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      email,
      role,
      avatar: user?.avatar
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="John Doe"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="user@example.com"
          type="email"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={(value: "admin" | "manager" | "staff") => setRole(value)}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password"
            placeholder="••••••••"
            required={!user}
          />
        </div>
      )}
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {user ? "Update User" : "Add User"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return <Badge className="bg-blue-500">Admin</Badge>
    case "manager":
      return <Badge className="bg-green-500">Manager</Badge>
    case "staff":
      return <Badge variant="outline">Staff</Badge>
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "Never"
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function UsersContent() {
  const { currentUser } = useUser()
  const [users, setUsers] = useState<UserType[]>(mockUsers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentUser2, setCurrentUser2] = useState<UserType | null>(null)

  if (currentUser?.role !== "admin") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  const handleAddUser = (user: Omit<UserType, "id" | "lastActive">) => {
    const newUser: UserType = {
      ...user,
      id: Math.random().toString(36).substring(2, 9),
      lastActive: new Date().toISOString()
    }
    setUsers([...users, newUser])
    setIsAddDialogOpen(false)
    toast({
      title: "User added",
      description: `${user.name} has been added successfully.`
    })
  }

  const handleUpdateUser = (user: Omit<UserType, "id" | "lastActive">) => {
    if (!currentUser2) return
    
    const updatedUsers = users.map(u => 
      u.id === currentUser2.id ? { ...u, ...user } : u
    )
    setUsers(updatedUsers)
    setIsEditDialogOpen(false)
    setCurrentUser2(null)
    toast({
      title: "User updated",
      description: `${user.name} has been updated successfully.`
    })
  }

  const handleDeleteUser = () => {
    if (!currentUser2) return
    
    const updatedUsers = users.filter(u => u.id !== currentUser2.id)
    setUsers(updatedUsers)
    setIsDeleteDialogOpen(false)
    setCurrentUser2(null)
    toast({
      title: "User deleted",
      description: `${currentUser2.name} has been deleted successfully.`
    })
  }

  return (
    <div className="container py-6">
      <PageHeader 
        title="User Management" 
        description="Manage user accounts and permissions"
        icon={<Users className="h-6 w-6" />}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Users</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new user.
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              onSubmit={handleAddUser} 
              onCancel={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{formatDate(user.lastActive)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={isEditDialogOpen && currentUser2?.id === user.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open)
                        if (!open) setCurrentUser2(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setCurrentUser2(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                              Update the user information below.
                            </DialogDescription>
                          </DialogHeader>
                          {currentUser2 && (
                            <UserForm 
                              user={currentUser2} 
                              onSubmit={handleUpdateUser} 
                              onCancel={() => {
                                setIsEditDialogOpen(false)
                                setCurrentUser2(null)
                              }} 
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={isDeleteDialogOpen && currentUser2?.id === user.id} onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open)
                        if (!open) setCurrentUser2(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setCurrentUser2(user)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this user? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setIsDeleteDialogOpen(false)
                              setCurrentUser2(null)
                            }}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteUser}>
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Layout>
      <UsersContent />
    </Layout>
  )
} 