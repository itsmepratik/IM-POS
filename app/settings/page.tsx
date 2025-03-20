"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { PageHeader } from "@/components/page-title"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Building, Users, Store, Plus, Edit, Trash2, MapPin, User, Phone, Mail, ArrowLeft, Shield, Lock } from "lucide-react"
import { useUser } from "../user-context"
import { BranchProvider, useBranch, Branch } from "../branch-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

function BranchForm({ branch, onSubmit, onCancel }: { 
  branch?: Branch, 
  onSubmit: (branch: Omit<Branch, "id">) => void,
  onCancel: () => void
}) {
  const [name, setName] = useState(branch?.name || "")
  const [location, setLocation] = useState(branch?.location || "")
  const [manager, setManager] = useState(branch?.manager || "")
  const [phone, setPhone] = useState(branch?.phone || "")
  const [email, setEmail] = useState(branch?.email || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      location,
      manager,
      phone,
      email
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Branch Name</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Main Store"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input 
          id="location" 
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          placeholder="Muscat, Oman"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="manager">Manager</Label>
        <Input 
          id="manager" 
          value={manager} 
          onChange={(e) => setManager(e.target.value)} 
          placeholder="John Doe"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          placeholder="+968 1234 5678"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="branch@example.com"
          type="email"
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {branch ? "Update Branch" : "Add Branch"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function BranchCard({ branch }: { branch: Branch }) {
  const { updateBranch, deleteBranch, currentBranch, setCurrentBranch } = useBranch()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const isMain = branch.id === "main"
  const isCurrent = currentBranch?.id === branch.id

  const handleUpdate = (updatedBranch: Omit<Branch, "id">) => {
    updateBranch({ ...updatedBranch, id: branch.id })
    setIsEditDialogOpen(false)
    toast({
      title: "Branch updated",
      description: `${updatedBranch.name} has been updated successfully.`
    })
  }

  const handleDelete = () => {
    deleteBranch(branch.id)
    setIsDeleteDialogOpen(false)
    toast({
      title: "Branch deleted",
      description: `${branch.name} has been deleted successfully.`
    })
  }

  return (
    <Card className={isCurrent ? "border-primary" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          {branch.name}
          {isCurrent && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Current
            </span>
          )}
        </CardTitle>
        {branch.location && (
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {branch.location}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        {branch.manager && (
          <div className="flex items-center gap-2 text-sm mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{branch.manager}</span>
          </div>
        )}
        {branch.phone && (
          <div className="flex items-center gap-2 text-sm mb-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{branch.phone}</span>
          </div>
        )}
        {branch.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{branch.email}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant={isCurrent ? "secondary" : "outline"} 
          size="sm"
          onClick={() => setCurrentBranch(branch)}
          disabled={isCurrent}
        >
          {isCurrent ? "Current Branch" : "Set as Current"}
        </Button>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90%] rounded-xl">
              <DialogHeader>
                <DialogTitle>Edit Branch</DialogTitle>
                <DialogDescription>
                  Update the branch information below.
                </DialogDescription>
              </DialogHeader>
              <BranchForm 
                branch={branch} 
                onSubmit={handleUpdate} 
                onCancel={() => setIsEditDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" disabled={isMain}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90%] rounded-xl">
              <DialogHeader>
                <DialogTitle>Delete Branch</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this branch? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  )
}

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

function SettingsContent() {
  const router = useRouter()
  const { currentUser } = useUser()
  const { branches, addBranch, currentBranch } = useBranch()
  const [storeName, setStoreName] = useState("My POS Store")
  const [storeAddress, setStoreAddress] = useState("123 Main St, Muscat, Oman")
  const [storePhone, setStorePhone] = useState("+968 1234 5678")
  const [storeEmail, setStoreEmail] = useState("info@myposstore.com")
  const [storeTax, setStoreTax] = useState("5")
  const [storeWebsite, setStoreWebsite] = useState("www.myposstore.com")
  const [isAddBranchDialogOpen, setIsAddBranchDialogOpen] = useState(false)
  const [users, setUsers] = useState<UserType[]>(mockUsers)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [currentUser2, setCurrentUser2] = useState<UserType | null>(null)

  if (currentUser?.role !== "admin") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  const handleAddBranch = (branch: Omit<Branch, "id">) => {
    const newBranch: Branch = {
      ...branch,
      id: Math.random().toString(36).substring(2, 9)
    }
    addBranch(newBranch)
    setIsAddBranchDialogOpen(false)
    toast({
      title: "Branch added",
      description: `${branch.name} has been added successfully.`
    })
  }

  const handleAddUser = (user: Omit<UserType, "id" | "lastActive">) => {
    const newUser: UserType = {
      ...user,
      id: Math.random().toString(36).substring(2, 9),
      lastActive: new Date().toISOString()
    }
    setUsers([...users, newUser])
    setIsAddUserDialogOpen(false)
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
    setIsEditUserDialogOpen(false)
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
    setIsDeleteUserDialogOpen(false)
    setCurrentUser2(null)
    toast({
      title: "User deleted",
      description: `${currentUser2.name} has been deleted successfully.`
    })
  }

  return (
    <div className="w-full">
      <PageHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your store settings and preferences
            </p>
          </div>
        </div>
      </PageHeader>
      
      <Tabs defaultValue="general" className="mt-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Update your store details and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input 
                    id="storeName" 
                    value={storeName} 
                    onChange={(e) => setStoreName(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Address</Label>
                  <Input 
                    id="storeAddress" 
                    value={storeAddress} 
                    onChange={(e) => setStoreAddress(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Phone</Label>
                  <Input 
                    id="storePhone" 
                    value={storePhone} 
                    onChange={(e) => setStorePhone(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Email</Label>
                  <Input 
                    id="storeEmail" 
                    value={storeEmail} 
                    onChange={(e) => setStoreEmail(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeTax">Tax Rate (%)</Label>
                  <Input 
                    id="storeTax" 
                    value={storeTax} 
                    onChange={(e) => setStoreTax(e.target.value)} 
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeWebsite">Website</Label>
                  <Input 
                    id="storeWebsite" 
                    value={storeWebsite} 
                    onChange={(e) => setStoreWebsite(e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Receipt Settings</CardTitle>
              <CardDescription>
                Customize your receipt appearance and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure how your receipts look and what information is displayed to customers.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Configure Receipt</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Branch Management</h2>
            <Dialog open={isAddBranchDialogOpen} onOpenChange={setIsAddBranchDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] rounded-xl">
                <DialogHeader>
                  <DialogTitle>Add New Branch</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new branch.
                  </DialogDescription>
                </DialogHeader>
                <BranchForm 
                  onSubmit={handleAddBranch} 
                  onCancel={() => setIsAddBranchDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Management</h2>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] rounded-lg">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new user.
                  </DialogDescription>
                </DialogHeader>
                <UserForm 
                  onSubmit={handleAddUser} 
                  onCancel={() => setIsAddUserDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Desktop view for users */}
          <div className="hidden md:block">
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
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name} />
                              ) : (
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              )}
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
                            <Dialog open={isEditUserDialogOpen && currentUser2?.id === user.id} onOpenChange={(open) => {
                              setIsEditUserDialogOpen(open)
                              if (!open) setCurrentUser2(null)
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => setCurrentUser2(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[90%] rounded-lg">
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
                                      setIsEditUserDialogOpen(false)
                                      setCurrentUser2(null)
                                    }} 
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog open={isDeleteUserDialogOpen && currentUser2?.id === user.id} onOpenChange={(open) => {
                              setIsDeleteUserDialogOpen(open)
                              if (!open) setCurrentUser2(null)
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => setCurrentUser2(user)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[90%] rounded-xl">
                                <DialogHeader>
                                  <DialogTitle>Delete User</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    setIsDeleteUserDialogOpen(false)
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
          
          {/* Mobile view for users */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : (
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <CardDescription className="text-xs">{user.email}</CardDescription>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2 pt-0">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Last active: {formatDate(user.lastActive)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-0">
                  <Dialog open={isEditUserDialogOpen && currentUser2?.id === user.id} onOpenChange={(open) => {
                    setIsEditUserDialogOpen(open)
                    if (!open) setCurrentUser2(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setCurrentUser2(user)}>
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] rounded-lg">
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
                            setIsEditUserDialogOpen(false)
                            setCurrentUser2(null)
                          }} 
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isDeleteUserDialogOpen && currentUser2?.id === user.id} onOpenChange={(open) => {
                    setIsDeleteUserDialogOpen(open)
                    if (!open) setCurrentUser2(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={() => setCurrentUser2(user)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] rounded-xl">
                      <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsDeleteUserDialogOpen(false)
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
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Layout>
      <BranchProvider>
        <SettingsContent />
      </BranchProvider>
    </Layout>
  )
}

