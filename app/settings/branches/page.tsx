"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { PageHeader } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Building, MapPin, User, Phone, Mail } from "lucide-react"
import { BranchProvider, useBranch, Branch } from "../../branch-context"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "../../user-context"

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
          placeholder="Main (Sanaya)"
          className="col-span-3"
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
            <DialogContent>
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
            <DialogContent>
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

function BranchesContent() {
  const { branches, addBranch } = useBranch()
  const { currentUser } = useUser()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  if (currentUser?.role !== "admin") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  const handleAddBranch = (branch: Omit<Branch, "id">) => {
    addBranch(branch)
    setIsAddDialogOpen(false)
    toast({
      title: "Branch added",
      description: `${branch.name} has been added successfully.`
    })
  }

  return (
    <div className="container py-6">
      <PageHeader 
        title="Branch Management" 
        description="Manage your store branches and locations"
        icon={<Building className="h-6 w-6" />}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Branches</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new branch.
              </DialogDescription>
            </DialogHeader>
            <BranchForm 
              onSubmit={handleAddBranch} 
              onCancel={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(branch => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
      </div>
    </div>
  )
}

export default function BranchesPage() {
  return (
    <Layout>
      <BranchProvider>
        <BranchesContent />
      </BranchProvider>
    </Layout>
  )
} 