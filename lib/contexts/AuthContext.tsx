"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";

type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: DbProfile | null;
  session: Session | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signInWithEmail: async () => false,
  signOut: async () => {},
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Load user profile from database
  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Handle case where profile doesn't exist (e.g., new user)
        if (error.code === "PGRST116") {
          console.log(
            "User profile not found - user may need to complete profile setup"
          );
          setProfile(null);
          return;
        }
        console.error("Error loading user profile:", error);
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Don't throw error, just set profile to null
      setProfile(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        loadUserProfile(session.user.id);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);

      setSession(session);
      setUser(session?.user || null);

      // Avoid async operations directly in callback - dispatch after callback finishes
      setTimeout(() => {
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        toast({
          title: "Welcome Back!",
          description: "Successfully signed in to your account.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Clear local storage
      localStorage.removeItem("selectedBranchId");

      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign Out Error",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signInWithEmail,
        signOut,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
