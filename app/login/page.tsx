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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, ArrowLeft } from "lucide-react";
import { createClient } from "@/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContactModal } from "./contact-modal";

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    // Function to update time for Oman (GMT+4)
    const updateTime = () => {
      const now = new Date();
      const omanTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Muscat",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
      setTime(`${omanTime} GMT+4`);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return <span className="text-sm font-medium text-muted-foreground tabular-nums">{time}</span>;
}

export default function LoginPage() {
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Background Gradient - Increased intensity for visibility on all screens */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(213, 243, 101, 0.5) 0%, rgba(213, 243, 101, 0.2) 50%, rgba(255, 255, 255, 1) 100%)"
        }}
      />
      
      {/* Header - Hidden on mobile (<768px) */}
      <header className="relative z-10 w-full p-4 md:p-6 justify-between items-center bg-transparent hidden md:flex">
        <div className="flex items-center">
          <h1 className="text-[20px] font-bold tracking-tight text-foreground/80 font-formula1 transition-all">
            HNS Automotive
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm transition-all">
            <LiveClock />
          </div>
          <ContactModal>
            <Button variant="secondary" size="sm" className="bg-white/50 hover:bg-white/80 border border-border/50 shadow-sm backdrop-blur-sm text-sm h-9 px-4 transition-all">
              Contact
            </Button>
          </ContactModal>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 -mt-16 md:mt-0">
        <Card className="w-full max-w-[420px] md:max-w-[480px] shadow-2xl shadow-black/5 border-border/60 bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-2 md:space-y-3 pb-6 text-center">
             {/* Back button removed */}
            <CardTitle className="text-lg font-bold tracking-tight md:text-[24px] leading-tight transition-all whitespace-nowrap">
              Welcome to HNS Automotive
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-muted-foreground/60 transition-all font-medium">
              Initiate authentication to gain access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <div className="space-y-1 mb-4">
                    <Label htmlFor="email-visible" className="text-sm font-semibold text-foreground/70">
                        Email
                    </Label>
                    <Input
                        id="email-visible"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 h-11"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground/70">
                        Password
                    </Label>
                </div>
                
                {/* Hidden email input for accessibility/managers */}
                <Input
                    id="email"
                    type="email"
                    className="hidden"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    aria-hidden="true"
                />

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 pr-10 h-11 tracking-widest"
                    placeholder="••••••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
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
                className="w-full h-11 text-base font-bold shadow-md bg-brand-lime text-black hover:bg-brand-lime/90"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Authenticate"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
