"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Lock, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBranch } from "@/lib/contexts/BranchContext";

type PasswordStatus = "loading" | "configured" | "not-configured" | "error";

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Supervisor (void-authorization) password per shop.
 * Passwords are per shop: the POS verifies a void against the password of
 * the shop that made the sale, so the target shop is chosen explicitly here.
 */
export function SupervisorPasswordCard(): React.JSX.Element {
  const { toast } = useToast();
  const { branches, currentBranch } = useBranch();

  const [shopId, setShopId] = useState<string>("");
  const [status, setStatus] = useState<PasswordStatus>("loading");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default the selector to the current branch once branches are known.
  useEffect(() => {
    if (!shopId && currentBranch?.id) setShopId(currentBranch.id);
  }, [currentBranch?.id, shopId]);

  const loadStatus = useCallback(async (targetShopId: string): Promise<void> => {
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/settings/supervisor-password?shopId=${encodeURIComponent(targetShopId)}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as ApiResult<{ configured: boolean }>;
      if (!json.success || !json.data) {
        setStatus("error");
        return;
      }
      setStatus(json.data.configured ? "configured" : "not-configured");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (shopId) void loadStatus(shopId);
  }, [shopId, loadStatus]);

  const selectedShopName =
    branches.find((b) => b.id === shopId)?.name ?? "selected shop";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!shopId) {
      toast({ title: "Error", description: "Select a shop first", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (status === "configured" && !currentPassword) {
      toast({ title: "Error", description: "Enter the current password to change it", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, string> = { shopId, newPassword };
      if (currentPassword) body.currentPassword = currentPassword;

      const res = await fetch("/api/settings/supervisor-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ApiResult<never> & { message?: string };

      if (data.success) {
        toast({
          title: "Success",
          description: `Supervisor password updated for ${selectedShopName}`,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatus("configured");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Supervisor Password</CardTitle>
        </div>
        <CardDescription>
          Required to authorize void transactions in POS. Each shop has its own
          password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supervisorShop">Shop</Label>
            <div className="flex items-center gap-3">
              <Select value={shopId} onValueChange={setShopId}>
                <SelectTrigger id="supervisorShop" className="w-[220px]">
                  <SelectValue placeholder="Select shop" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span aria-live="polite">
                {status === "loading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Checking status" />
                )}
                {status === "configured" && <Badge variant="secondary">Password set</Badge>}
                {status === "not-configured" && (
                  <Badge variant="destructive">Not set — voids are blocked</Badge>
                )}
                {status === "error" && <Badge variant="outline">Status unavailable</Badge>}
              </span>
            </div>
          </div>

          {status === "configured" && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isSubmitting || !shopId || status === "loading"}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Lock className="h-4 w-4" aria-hidden="true" />
            )}
            {status === "configured" ? "Change Password" : "Set Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
