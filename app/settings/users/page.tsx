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
import { Plus, Edit, Trash2, Users, User, Mail, Lock, Shield, Loader2 } from "lucide-react"
import { useUser } from "../../user-context"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUsers, UserType } from "@/lib/client"

function UserForm({ user, onSubmit, onCancel }: { 
  user?: UserType, 
  onSubmit: (user: Omit<UserType, "id" | "lastActive">) => void,
  onCancel: () => void
}) {
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [role, setRole] = useState(user?.role || "Staff")
  const [phone, setPhone] = useState(user?.phone || "")
  const [status, setStatus] = useState<"active" | "inactive">(user?.status || "active")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      email,
      role,
      phone,
      status,
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
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          placeholder="+968 9123 4567"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Sales Associate">Sales Associate</SelectItem>
            <SelectItem value="Accountant">Accountant</SelectItem>
            <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(value: "active" | "inactive") => setStatus(value)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
    case "Manager":
      return <Badge className="bg-blue-500">Manager</Badge>
    case "Sales Associate":
      return <Badge className="bg-green-500">Sales</Badge>
    case "Accountant":
      return <Badge variant="outline" className="bg-purple-500">Accountant</Badge>
    case "Inventory Manager":
      return <Badge className="bg-amber-500">Inventory</Badge>
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "Never"
  if (dateString.includes("now") || dateString.includes("ago")) return dateString
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function UsersContent() {
  const { currentUser } = useUser()
  const { users, isLoading, error, addUser, updateUser, deleteUser } = useUsers()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentUser2, setCurrentUser2] = useState<UserType | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading users: {error.message}
      </div>
    )
  }

  if (currentUser?.role !== "admin") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  const handleAddUser = async (userData: Omit<UserType, "id" | "lastActive">) => {
    const result = await addUser(userData)
    if (result) {
      setIsAddDialogOpen(false)
      toast({
        title: "User added",
        description: `${userData.name} has been added successfully.`
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateUser = async (userData: Omit<UserType, "id" | "lastActive">) => {
    if (!currentUser2) return
    
    const updatedUser = {
      ...currentUser2,
      ...userData
    }
    
    const success = await updateUser(updatedUser)
    
    if (success) {
      setIsEditDialogOpen(false)
      setCurrentUser2(null)
      toast({
        title: "User updated",
        description: `${userData.name} has been updated successfully.`
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!currentUser2) return
    
    const success = await deleteUser(currentUser2.id)
    
    if (success) {
      setIsDeleteDialogOpen(false)
      setCurrentUser2(null)
      toast({
        title: "User deleted",
        description: `The user has been deleted successfully.`
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users</h2>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system and set their permissions.
              </DialogDescription>
            </DialogHeader>
            <UserForm onSubmit={handleAddUser} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage system users and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.split(' ').map(name => name[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.status === "active" ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500 border-red-500">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.lastActive)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setCurrentUser2(user)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setCurrentUser2(user)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Layout>
      <PageHeader 
        title="User Management" 
        description="Manage system users and permissions" 
        icon={<Users className="h-6 w-6" />}
      />
      <UsersContent />
    </Layout>
  )
} 