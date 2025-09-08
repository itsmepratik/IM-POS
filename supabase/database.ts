// Re-export types from the types directory
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./types/database";

// Export constants for easy access
export const Constants = {
  public: {
    Enums: {
      permission: [
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
      user_role: ["admin", "shop"],
    },
  },
} as const;
