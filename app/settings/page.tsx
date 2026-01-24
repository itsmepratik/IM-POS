"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { PageHeader } from "@/components/page-title";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Building,
  Users,
  Store,
  Plus,
  Edit,
  Trash2,
  MapPin,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Shield,
  Lock,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react";
import { useUser } from "@/lib/contexts/UserContext";
import { BranchProvider, useBranch } from "@/lib/contexts/BranchContext";
import { Branch, updateShop } from "@/lib/services/inventoryService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSettingsUsers } from "@/lib/hooks/data/useSettingsUsers";

// User type definition
interface UserType {
  id: string;
  name: string;
  staff_id: string;
  is_active: boolean;
  lastActive?: string;
}

function ShopForm({
  shop,
  onSubmit,
  onCancel,
  isLoading,
}: {
  shop?: Branch;
  onSubmit: (shop: Partial<Branch>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  // General
  const [name, setName] = useState(shop?.name || "");
  const [displayName, setDisplayName] = useState(shop?.name || ""); // Mapped from name/display_name
  const [companyName, setCompanyName] = useState(shop?.company_name || "");
  const [companyNameArabic, setCompanyNameArabic] = useState(shop?.company_name_arabic || "");
  const [crNumber, setCrNumber] = useState(shop?.cr_number || "");
  
  // Contact
  const [contactNumber, setContactNumber] = useState(shop?.contact_number || "");
  const [contactNumberArabic, setContactNumberArabic] = useState(shop?.contact_number_arabic || "");
  
  // Address
  const [addressLine1, setAddressLine1] = useState(shop?.address_line_1 || "");
  const [addressLine2, setAddressLine2] = useState(shop?.address_line_2 || "");
  const [addressLine3, setAddressLine3] = useState(shop?.address_line_3 || "");
  const [addressLineArabic1, setAddressLineArabic1] = useState(shop?.address_line_arabic_1 || "");
  const [addressLineArabic2, setAddressLineArabic2] = useState(shop?.address_line_arabic_2 || "");
  
  // Bill Details
  const [serviceDescEn, setServiceDescEn] = useState(shop?.service_description_en || "");
  const [serviceDescAr, setServiceDescAr] = useState(shop?.service_description_ar || "");
  const [thankYouEn, setThankYouEn] = useState(shop?.thank_you_message || "");
  const [thankYouAr, setThankYouAr] = useState(shop?.thank_you_message_ar || "");
  
  // Brand Info
  const [brandName, setBrandName] = useState(shop?.brand_name || "");
  const [brandAddress, setBrandAddress] = useState(shop?.brand_address || "");
  const [brandPhones, setBrandPhones] = useState(shop?.brand_phones || "");
  const [brandWhatsapp, setBrandWhatsapp] = useState(shop?.brand_whatsapp || "");
  const [posId, setPosId] = useState(shop?.pos_id || "");

  // Update state when shop prop changes (fixes stale data on re-open or context refresh)
  useEffect(() => {
    if (shop) {
      setName(shop.name || "");
      setDisplayName(shop.name || "");
      setCompanyName(shop.company_name || "");
      setCompanyNameArabic(shop.company_name_arabic || "");
      setCrNumber(shop.cr_number || "");
      setContactNumber(shop.contact_number || "");
      setContactNumberArabic(shop.contact_number_arabic || "");
      setAddressLine1(shop.address_line_1 || "");
      setAddressLine2(shop.address_line_2 || "");
      setAddressLine3(shop.address_line_3 || "");
      setAddressLineArabic1(shop.address_line_arabic_1 || "");
      setAddressLineArabic2(shop.address_line_arabic_2 || "");
      setServiceDescEn(shop.service_description_en || "");
      setServiceDescAr(shop.service_description_ar || "");
      setThankYouEn(shop.thank_you_message || "");
      setThankYouAr(shop.thank_you_message_ar || "");
      setBrandName(shop.brand_name || "");
      setBrandAddress(shop.brand_address || "");
      setBrandPhones(shop.brand_phones || "");
      setBrandWhatsapp(shop.brand_whatsapp || "");
      setPosId(shop.pos_id || "");
    }
  }, [shop]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      // Read-only/immutable fields like 'name' (display name) are NOT updated here usually, 
      // but user asked to update "everything except the name display name and is active".
      // We will send the editable fields.
      company_name: companyName,
      company_name_arabic: companyNameArabic,
      cr_number: crNumber,
      contact_number: contactNumber,
      contact_number_arabic: contactNumberArabic,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      address_line_3: addressLine3,
      address_line_arabic_1: addressLineArabic1,
      address_line_arabic_2: addressLineArabic2,
      service_description_en: serviceDescEn,
      service_description_ar: serviceDescAr,
      thank_you_message: thankYouEn,
      thank_you_message_ar: thankYouAr,
      brand_name: brandName,
      brand_address: brandAddress,
      brand_phones: brandPhones,
      brand_whatsapp: brandWhatsapp,
      pos_id: posId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-[60vh] flex flex-col">
      <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="bill">Bill Info</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto py-4 px-1">
          <TabsContent value="general" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Read Only)</Label>
              <Input id="displayName" value={displayName} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="My Company LLC" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyNameArabic" className="font-arabic">اسم الشركة</Label>
                <Input id="companyNameArabic" value={companyNameArabic} onChange={(e) => setCompanyNameArabic(e.target.value)} placeholder="شركتي ش.م.م" dir="rtl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crNumber">CR Number</Label>
              <Input id="crNumber" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} placeholder="1234567" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input id="contactNumber" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+968 1234 5678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumberArabic" className="font-arabic">رقم الاتصال</Label>
                <Input id="contactNumberArabic" value={contactNumberArabic} onChange={(e) => setContactNumberArabic(e.target.value)} placeholder="+٩٦٨ ١٢٣٤ ٥٦٧٨" dir="rtl" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="address" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Building 123, Street 45" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="District, City" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine3">Address Line 3</Label>
              <Input id="addressLine3" value={addressLine3} onChange={(e) => setAddressLine3(e.target.value)} placeholder="Country, Zip" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLineArabic1" className="font-arabic">العنوان ١</Label>
              <Input id="addressLineArabic1" value={addressLineArabic1} onChange={(e) => setAddressLineArabic1(e.target.value)} placeholder="مبنى ١٢٣، شارع ٤٥" dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLineArabic2" className="font-arabic">العنوان ٢</Label>
              <Input id="addressLineArabic2" value={addressLineArabic2} onChange={(e) => setAddressLineArabic2(e.target.value)} placeholder="المنطقة، المدينة" dir="rtl" />
            </div>
          </TabsContent>
          
          <TabsContent value="bill" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label htmlFor="serviceDescEn">Service Desc (En)</Label>
                 <Input id="serviceDescEn" value={serviceDescEn} onChange={(e) => setServiceDescEn(e.target.value)} />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="serviceDescAr" className="font-arabic">وصف الخدمة (عربي)</Label>
                 <Input id="serviceDescAr" value={serviceDescAr} onChange={(e) => setServiceDescAr(e.target.value)} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label htmlFor="thankYouEn">Thank You Msg (En)</Label>
                 <Input id="thankYouEn" value={thankYouEn} onChange={(e) => setThankYouEn(e.target.value)} />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="thankYouAr" className="font-arabic">رسالة الشكر (عربي)</Label>
                 <Input id="thankYouAr" value={thankYouAr} onChange={(e) => setThankYouAr(e.target.value)} dir="rtl" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="brand" className="space-y-4 mt-0">
             <div className="space-y-2">
               <Label htmlFor="brandName">Brand Name</Label>
               <Input id="brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
             </div>
             <div className="space-y-2">
               <Label htmlFor="brandAddress">Brand Address</Label>
               <Input id="brandAddress" value={brandAddress} onChange={(e) => setBrandAddress(e.target.value)} />
             </div>
             <div className="space-y-2">
               <Label htmlFor="brandPhones">Brand Phones</Label>
               <Input id="brandPhones" value={brandPhones} onChange={(e) => setBrandPhones(e.target.value)} />
             </div>
             <div className="space-y-2">
               <Label htmlFor="brandWhatsapp">Brand Whatsapp</Label>
               <Input id="brandWhatsapp" value={brandWhatsapp} onChange={(e) => setBrandWhatsapp(e.target.value)} />
             </div>
             <div className="space-y-2">
               <Label htmlFor="posId">POS ID</Label>
               <Input id="posId" value={posId} onChange={(e) => setPosId(e.target.value)} placeholder="e.g. A0054" />
             </div>
           </TabsContent>
        </div>
      </Tabs>

      <DialogFooter className="pt-4 border-t mt-auto">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ShopCard component for branch management
function ShopCard({ shop }: { shop: Branch }) {
  const { toast } = useToast();
  const { currentBranch, selectBranch, refreshBranches } = useBranch();
  
  // Use inventoryService updateShop for updates
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMain = shop.id === "main"; // Might need better check
  const isCurrent = currentBranch?.id === shop.id;

  const handleUpdate = async (updatedShopData: Partial<Branch>) => {
    setIsSaving(true);
    try {
      const updated = await updateShop(shop.id, updatedShopData);
      if (updated) {
        setIsEditDialogOpen(false);
        toast({
          title: "Shop Updated Successfully",
          description: "All changes have been saved to the database.",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        // Refresh branches context to update UI immediately
        await refreshBranches();
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={isCurrent ? "border-primary" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          {shop.name}
          {isCurrent && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Current
            </span>
          )}
        </CardTitle>
        {shop.address && (
          <CardDescription className="flex items-center gap-1">
             <MapPin className="h-3.5 w-3.5" />
             {shop.address} 
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2 text-sm text-muted-foreground">
        {shop.company_name && <div>{shop.company_name}</div>}
        {shop.contact_number && <div>{shop.contact_number}</div>}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button
          variant={isCurrent ? "secondary" : "outline"}
          size="sm"
          onClick={() => selectBranch(shop.id)}
          disabled={isCurrent}
        >
          {isCurrent ? "Current Shop" : "Set as Current"}
        </Button>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[800px] max-w-[95vw] rounded-xl">
              <DialogHeader>
                <DialogTitle>Edit Shop</DialogTitle>
                <DialogDescription>
                  Update the shop information below.
                </DialogDescription>
              </DialogHeader>
              <ShopForm
                shop={shop}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditDialogOpen(false)}
                isLoading={isSaving}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}

function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
}: {
  user?: UserType;
  onSubmit: (user: Partial<UserType>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(user?.name || "");
  const [staffId, setStaffId] = useState(user?.staff_id || "");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      staff_id: staffId,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="staffId">Staff ID</Label>
        <Input
          id="staffId"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          placeholder="0010"
          required
          disabled={!!user || isLoading} // Staff ID should not be changeable for consistency, or maybe allow it if backend supports
        />
        {user && <p className="text-xs text-muted-foreground">Staff ID cannot be changed once created.</p>}
      </div>

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

      {user && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <div className="flex items-center space-x-2">
             <Button
                type="button"
                variant={isActive ? "default" : "outline"}
                onClick={() => setIsActive(true)}
                className="w-full"
              >
                Active
              </Button>
              <Button
                type="button"
                variant={!isActive ? "destructive" : "outline"}
                onClick={() => setIsActive(false)}
                className="w-full"
                disabled={isLoading}
              >
                Inactive
              </Button>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {user ? "Update Staff" : "Add Staff"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// getRoleBadge function removed as it is no longer used for staff
// If needed for other tabs, it should be adapted or moved.

function formatDate(dateString?: string) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SettingsContent() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { branches } = useBranch();
  // Stub missing actions (unused)
  const addBranch = (_b: unknown) => { /* not implemented */ };
  const updateBranch = (_b: unknown) => { /* not implemented */ };
  const deleteBranch = (_id: string) => { /* not implemented */ };
  const { toast } = useToast();

  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | undefined>();
  const [storeName, setStoreName] = useState("HA Automotives");
  const [storeAddress, setStoreAddress] = useState(
    "123 Main Street, Muscat, Oman"
  );
  const [storePhone, setStorePhone] = useState("+968 9123 4567");
  const [storeEmail, setStoreEmail] = useState("info@hautomotives.com");
  const [storeTax, setStoreTax] = useState("5");
  const [storeCurrency, setStoreCurrency] = useState("OMR");
  const [timeZone, setTimeZone] = useState("GMT+4");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState<UserType | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("users");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const { users, isLoading, addUser, updateUser, deleteUser } =
    useSettingsUsers();

  const handleAddBranch = (branch: Omit<Branch, "id">) => {
    // Add branch with generated ID
    addBranch({
      ...branch,
      id: `branch${Date.now()}`,
    });
    setShowBranchForm(false);
  };

  const handleAddUser = async (
    userData: Omit<UserType, "id" | "lastActive">
  ) => {
    setIsSubmitting(true);
    try {
      const newUser = await addUser(userData);
      if (newUser) {
        setAddUserDialogOpen(false);
        setShowUserForm(false);
        
        setStatusDialog({
          open: true,
          title: "Success",
          description: "Staff added successfully",
        });
      } else {
        setStatusDialog({
          open: true,
          title: "Error",
          description: "Failed to add user",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userData: UserType) => {
    setIsSubmitting(true);
    try {
      const success = await updateUser(userData);
      if (success) {
        setEditUser(undefined); // Close the edit dialog
        setSelectedUser(null);
        setStatusDialog({
          open: true,
          title: "Success",
          description: "Staff updated successfully",
        });
      } else {
        setStatusDialog({
          open: true,
          title: "Error",
          description: "Failed to update user",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsSubmitting(true);
    try {
      const success = await deleteUser(userId);
      if (success) {
        setIsDeleting(false);
        setUserToDelete("");
        setStatusDialog({
          open: true,
          title: "Success",
          description: "User deleted successfully",
        });
      } else {
        setStatusDialog({
          open: true,
          title: "Error",
          description: "Failed to delete user",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs
        value={activeTab || undefined}
        onValueChange={setActiveTab}
        className="mt-4"
      >
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branches">Shops</TabsTrigger>
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
                  <Label htmlFor="storeCurrency">Currency</Label>
                  <Input
                    id="storeCurrency"
                    value={storeCurrency}
                    onChange={(e) => setStoreCurrency(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Input
                    id="timeZone"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
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
                Configure how your receipts look and what information is
                displayed to customers.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Configure Receipt</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Shop Management</h2>
            {/* removed add branch button as it's not requested/supported efficiently yet and user only asked for edit */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <ShopCard key={branch.id} shop={branch} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Management</h2>
            <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] rounded-lg">
                <DialogHeader>
                  <DialogTitle>Add New Staff</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new staff member.
                  </DialogDescription>
                </DialogHeader>
                <UserForm
                  onSubmit={handleAddUser}
                  onCancel={() => setShowUserForm(false)}
                  isLoading={isSubmitting}
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
                      <TableHead>Staff Member</TableHead>
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
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.staff_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant={user.is_active ? "default" : "secondary"}>
                             {user.is_active ? "Active" : "Inactive"}
                           </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.lastActive)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog
                              open={editUser && editUser.id === user.id}
                              onOpenChange={(open) => {
                                setEditUser(open ? user : undefined);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setEditUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[90%] rounded-lg">
                                <DialogHeader>
                                  <DialogTitle>Edit Staff</DialogTitle>
                                  <DialogDescription>
                                    Update the staff information below.
                                  </DialogDescription>
                                </DialogHeader>
                                {editUser && (
                                  <UserForm
                                    user={editUser}
                                    onSubmit={handleUpdateUser}
                                    onCancel={() => setEditUser(undefined)}
                                    isLoading={isSubmitting}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={isDeleting && userToDelete === user.id}
                              onOpenChange={(open) => {
                                setIsDeleting(open);
                                if (!open) setUserToDelete("");
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setUserToDelete(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[90%] rounded-xl">
                                <DialogHeader>
                                  <DialogTitle>Delete Staff</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this staff member?
                                    This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsDeleting(false);
                                      setUserToDelete("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
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
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Avatar className="h-10 w-10">
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {user.staff_id}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="mt-1 sm:mt-0">
                       <Badge variant={user.is_active ? "default" : "secondary"}>
                         {user.is_active ? "Active" : "Inactive"}
                       </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2 pt-0">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Last active: {formatDate(user.lastActive)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-0">
                  <Dialog
                    open={editUser && editUser.id === user.id}
                    onOpenChange={(open) => {
                      setEditUser(open ? user : undefined);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditUser(user)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] rounded-lg">
                      <DialogHeader>
                        <DialogTitle>Edit Staff</DialogTitle>
                        <DialogDescription>
                          Update the staff information below.
                        </DialogDescription>
                      </DialogHeader>
                      {editUser && (
                        <UserForm
                          user={editUser}
                          onSubmit={handleUpdateUser}
                          onCancel={() => setEditUser(undefined)}
                          isLoading={isSubmitting}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isDeleting && userToDelete === user.id}
                    onOpenChange={(open) => {
                      setIsDeleting(open);
                      if (!open) setUserToDelete("");
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive"
                        onClick={() => setUserToDelete(user.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] rounded-xl">
                      <DialogHeader>
                        <DialogTitle>Delete Staff</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this staff member? This action
                          cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDeleting(false);
                            setUserToDelete("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
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

      <AlertDialog
        open={statusDialog.open}
        onOpenChange={(open) =>
          setStatusDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() =>
                setStatusDialog((prev) => ({ ...prev, open: false }))
              }
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Layout>
      <BranchProvider>
        <SettingsContent />
      </BranchProvider>
    </Layout>
  );
}
