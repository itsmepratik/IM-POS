"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Let middleware handle role-based redirect
        router.push("/");
      }
    };
    checkUser();
  }, [supabase.auth, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.user) {
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        // Let middleware handle role-based redirect
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-2 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#FAFAF8" }}
    >
      <Card className="w-full max-w-md shadow-lg shadow-black/5 border border-border/100 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle
            className="font-bold"
            style={{
              fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
              lineHeight: "clamp(1.75rem, 5vw, 2rem)",
            }}
          >
            Welcome to HNS Automotive
          </CardTitle>
          <CardDescription
            style={{
              fontSize: "clamp(0.875rem, 2.5vw, 0.875rem)",
              lineHeight: "clamp(1.25rem, 3vw, 1.25rem)",
            }}
          >
            Sign in to initiate authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                style={{
                  fontSize: "clamp(0.875rem, 2vw, 0.875rem)",
                  fontWeight: "500",
                }}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                style={{
                  fontSize: "clamp(0.875rem, 2vw, 0.875rem)",
                  fontWeight: "500",
                }}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              style={{
                fontSize: "clamp(0.875rem, 2.5vw, 0.875rem)",
                fontWeight: "600",
                padding: "clamp(0.5rem, 3vw, 0.75rem) clamp(1rem, 4vw, 1.5rem)",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p
            className="text-muted-foreground text-center w-full"
            style={{
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              lineHeight: "clamp(1rem, 2.5vw, 1.25rem)",
            }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
