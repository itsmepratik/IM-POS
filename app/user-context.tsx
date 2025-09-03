"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "admin" | "shop";

export type Permission =
  | "pos.access"
  | "inventory.access"
  | "customers.access"
  | "transactions.access"
  | "notifications.access"
  | "reports.access"
  | "settings.access"
  | "users.access"
  | "admin.access";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  supabaseUser: SupabaseUser | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  signOut: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  isAdmin: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Mock users for backward compatibility
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@hnsautomotive.com",
      role: "admin",
      permissions: [
        "pos.access",
        "inventory.access",
        "customers.access",
        "transactions.access",
        "notifications.access",
        "reports.access",
        "settings.access",
        "users.access",
        "admin.access",
      ],
    },
  ]);

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setSupabaseUser(user);

        if (user) {
          // Get role and permissions from JWT claims or fetch from database
          const role =
            user.app_metadata?.app_role || user.user_metadata?.role || "shop";
          const permissions = user.app_metadata?.permissions || [];

          // Use the new function to get profile and permissions
          try {
            const { data, error } = await supabase.rpc(
              "get_user_profile_with_permissions",
              { user_id: user.id }
            );

            if (error) {
              console.error(
                "Error calling get_user_profile_with_permissions:",
                error
              );
              throw error;
            }

            if (data && data.profile) {
              const profile = data.profile;
              const permissions = data.permissions || [];

              console.log("Loaded user profile and permissions:", {
                userId: user.id,
                email: user.email,
                role: profile.role,
                permissions: permissions,
                isAdmin: profile.is_admin,
              });

              const mappedUser: User = {
                id: user.id,
                name: profile.full_name || user.email?.split("@")[0] || "User",
                email: user.email || "",
                role: profile.role as UserRole,
                permissions: permissions as Permission[],
              };
              setCurrentUser(mappedUser);
            } else {
              console.error("No user profile data returned for user:", user.id);
              // Create a basic user profile if it doesn't exist
              const fallbackRole =
                user.email === "admin@hnsautomotive.com" ? "admin" : "shop";
              const fallbackPermissions =
                fallbackRole === "admin"
                  ? [
                      "pos.access",
                      "inventory.access",
                      "customers.access",
                      "transactions.access",
                      "notifications.access",
                      "reports.access",
                      "settings.access",
                      "users.access",
                      "admin.access",
                    ]
                  : [
                      "pos.access",
                      "inventory.access",
                      "customers.access",
                      "transactions.access",
                      "notifications.access",
                    ];

              const mappedUser: User = {
                id: user.id,
                name:
                  user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User",
                email: user.email || "",
                role: fallbackRole as UserRole,
                permissions: fallbackPermissions as Permission[],
              };
              setCurrentUser(mappedUser);

              // Try to create the missing profile
              try {
                await supabase.from("user_profiles").insert({
                  id: user.id,
                  email: user.email,
                  full_name:
                    user.user_metadata?.full_name ||
                    user.email?.split("@")[0] ||
                    "User",
                  role: fallbackRole,
                  is_admin: fallbackRole === "admin",
                });
                console.log("Created missing user profile for:", user.email);
              } catch (insertError) {
                console.error("Could not create user profile:", insertError);
              }
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // Fallback user with some permissions based on email
            const fallbackRole =
              user.email === "admin@hnsautomotive.com" ? "admin" : "shop";
            const fallbackPermissions =
              fallbackRole === "admin"
                ? [
                    "pos.access",
                    "inventory.access",
                    "customers.access",
                    "transactions.access",
                    "notifications.access",
                    "reports.access",
                    "settings.access",
                    "users.access",
                    "admin.access",
                  ]
                : [
                    "pos.access",
                    "inventory.access",
                    "customers.access",
                    "transactions.access",
                    "notifications.access",
                  ];

            const mappedUser: User = {
              id: user.id,
              name:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "User",
              email: user.email || "",
              role: fallbackRole as UserRole,
              permissions: fallbackPermissions as Permission[],
            };
            setCurrentUser(mappedUser);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setSupabaseUser(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);

        // Use the same function as in getUser
        try {
          const { data, error } = await supabase.rpc(
            "get_user_profile_with_permissions",
            { user_id: session.user.id }
          );

          if (error) {
            console.error(
              "Error calling get_user_profile_with_permissions in auth change:",
              error
            );
            throw error;
          }

          if (data && data.profile) {
            const profile = data.profile;
            const permissions = data.permissions || [];

            const mappedUser: User = {
              id: session.user.id,
              name:
                profile.full_name ||
                session.user.email?.split("@")[0] ||
                "User",
              email: session.user.email || "",
              role: profile.role as UserRole,
              permissions: permissions as Permission[],
            };
            setCurrentUser(mappedUser);
          } else {
            // Fallback for auth change
            const fallbackRole =
              session.user.email === "admin@hnsautomotive.com"
                ? "admin"
                : "shop";
            const fallbackPermissions =
              fallbackRole === "admin"
                ? [
                    "pos.access",
                    "inventory.access",
                    "customers.access",
                    "transactions.access",
                    "notifications.access",
                    "reports.access",
                    "settings.access",
                    "users.access",
                    "admin.access",
                  ]
                : [
                    "pos.access",
                    "inventory.access",
                    "customers.access",
                    "transactions.access",
                    "notifications.access",
                  ];

            const mappedUser: User = {
              id: session.user.id,
              name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split("@")[0] ||
                "User",
              email: session.user.email || "",
              role: fallbackRole as UserRole,
              permissions: fallbackPermissions as Permission[],
            };
            setCurrentUser(mappedUser);
          }
        } catch (error) {
          console.error("Error fetching user profile in auth change:", error);
          const fallbackRole =
            session.user.email === "admin@hnsautomotive.com" ? "admin" : "shop";
          const fallbackPermissions =
            fallbackRole === "admin"
              ? [
                  "pos.access",
                  "inventory.access",
                  "customers.access",
                  "transactions.access",
                  "notifications.access",
                  "reports.access",
                  "settings.access",
                  "users.access",
                  "admin.access",
                ]
              : [
                  "pos.access",
                  "inventory.access",
                  "customers.access",
                  "transactions.access",
                  "notifications.access",
                ];

          const mappedUser: User = {
            id: session.user.id,
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "User",
            email: session.user.email || "",
            role: fallbackRole as UserRole,
            permissions: fallbackPermissions as Permission[],
          };
          setCurrentUser(mappedUser);
        }
      } else {
        setSupabaseUser(null);
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const addUser = (newUser: Omit<User, "id">) => {
    setUsers((prevUsers) => [
      ...prevUsers,
      { ...newUser, id: Date.now().toString() },
    ]);
  };

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, ...updatedUser } : user
      )
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return currentUser?.permissions?.includes(permission) || false;
  };

  const isAdmin = (): boolean => {
    return currentUser?.role === "admin" || false;
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        supabaseUser,
        setCurrentUser,
        addUser,
        updateUser,
        deleteUser,
        signOut,
        isLoading,
        hasPermission,
        isAdmin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
