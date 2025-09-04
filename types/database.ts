export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          phone: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          phone?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      lubricant_inventory: {
        Row: {
          batch_number: string;
          branch_id: string | null;
          created_at: string | null;
          expiry_date: string | null;
          id: string;
          lubricant_id: string | null;
          notes: string | null;
          purchase_date: string | null;
          quantity_available: number;
          supplier_name: string | null;
          unit_cost: number | null;
          updated_at: string | null;
          volume_id: string | null;
        };
        Insert: {
          batch_number: string;
          branch_id?: string | null;
          created_at?: string | null;
          expiry_date?: string | null;
          id?: string;
          lubricant_id?: string | null;
          notes?: string | null;
          purchase_date?: string | null;
          quantity_available?: number;
          supplier_name?: string | null;
          unit_cost?: number | null;
          updated_at?: string | null;
          volume_id?: string | null;
        };
        Update: {
          batch_number?: string;
          branch_id?: string | null;
          created_at?: string | null;
          expiry_date?: string | null;
          id?: string;
          lubricant_id?: string | null;
          notes?: string | null;
          purchase_date?: string | null;
          quantity_available?: number;
          supplier_name?: string | null;
          unit_cost?: number | null;
          updated_at?: string | null;
          volume_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lubricant_inventory_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lubricant_inventory_lubricant_id_fkey";
            columns: ["lubricant_id"];
            isOneToOne: false;
            referencedRelation: "lubricants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lubricant_inventory_volume_id_fkey";
            columns: ["volume_id"];
            isOneToOne: false;
            referencedRelation: "lubricant_volumes";
            referencedColumns: ["id"];
          }
        ];
      };
      lubricant_volumes: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          lubricant_id: string | null;
          price: number;
          size: string;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          lubricant_id?: string | null;
          price: number;
          size: string;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          lubricant_id?: string | null;
          price?: number;
          size?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "lubricant_volumes_lubricant_id_fkey";
            columns: ["lubricant_id"];
            isOneToOne: false;
            referencedRelation: "lubricants";
            referencedColumns: ["id"];
          }
        ];
      };
      lubricants: {
        Row: {
          base_price: number;
          brand_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          type: string;
        };
        Insert: {
          base_price: number;
          brand_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          type: string;
        };
        Update: {
          base_price?: number;
          brand_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lubricants_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          }
        ];
      };
      product_inventory: {
        Row: {
          batch_number: string;
          branch_id: string | null;
          created_at: string | null;
          expiry_date: string | null;
          id: string;
          notes: string | null;
          product_id: string | null;
          purchase_date: string | null;
          quantity_available: number;
          supplier_name: string | null;
          unit_cost: number | null;
          updated_at: string | null;
        };
        Insert: {
          batch_number: string;
          branch_id?: string | null;
          created_at?: string | null;
          expiry_date?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string | null;
          purchase_date?: string | null;
          quantity_available?: number;
          supplier_name?: string | null;
          unit_cost?: number | null;
          updated_at?: string | null;
        };
        Update: {
          batch_number?: string;
          branch_id?: string | null;
          created_at?: string | null;
          expiry_date?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string | null;
          purchase_date?: string | null;
          quantity_available?: number;
          supplier_name?: string | null;
          unit_cost?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_inventory_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_types: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_types_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          brand_id: string | null;
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          price: number;
          product_type_id: string | null;
          sku: string | null;
        };
        Insert: {
          brand_id?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          price: number;
          product_type_id?: string | null;
          sku?: string | null;
        };
        Update: {
          brand_id?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          price?: number;
          product_type_id?: string | null;
          sku?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_product_type_id_fkey";
            columns: ["product_type_id"];
            isOneToOne: false;
            referencedRelation: "product_types";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          branch_id: string | null;
          created_at: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean | null;
          last_name: string | null;
          phone: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          is_active?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          role: string;
          updated_at?: string | null;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "user_info";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_items: {
        Row: {
          bottle_type: string | null;
          created_at: string | null;
          id: string;
          item_type: string;
          lubricant_inventory_id: string | null;
          product_inventory_id: string | null;
          quantity: number;
          sale_id: string | null;
          total_price: number;
          unit_price: number;
        };
        Insert: {
          bottle_type?: string | null;
          created_at?: string | null;
          id?: string;
          item_type: string;
          lubricant_inventory_id?: string | null;
          product_inventory_id?: string | null;
          quantity: number;
          sale_id?: string | null;
          total_price: number;
          unit_price: number;
        };
        Update: {
          bottle_type?: string | null;
          created_at?: string | null;
          id?: string;
          item_type?: string;
          lubricant_inventory_id?: string | null;
          product_inventory_id?: string | null;
          quantity?: number;
          sale_id?: string | null;
          total_price?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_lubricant_inventory_id_fkey";
            columns: ["lubricant_inventory_id"];
            isOneToOne: false;
            referencedRelation: "lubricant_inventory";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_product_inventory_id_fkey";
            columns: ["product_inventory_id"];
            isOneToOne: false;
            referencedRelation: "product_inventory";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
          branch_id: string | null;
          created_at: string | null;
          customer_id: string | null;
          discount_amount: number | null;
          id: string;
          payment_method: string | null;
          receipt_number: string | null;
          staff_id: string | null;
          total_amount: number;
          trade_in_amount: number | null;
          transaction_date: string | null;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          customer_id?: string | null;
          discount_amount?: number | null;
          id?: string;
          payment_method?: string | null;
          receipt_number?: string | null;
          staff_id?: string | null;
          total_amount: number;
          trade_in_amount?: number | null;
          transaction_date?: string | null;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          customer_id?: string | null;
          discount_amount?: number | null;
          id?: string;
          payment_method?: string | null;
          receipt_number?: string | null;
          staff_id?: string | null;
          total_amount?: number;
          trade_in_amount?: number | null;
          transaction_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      // Legacy tables (keeping for compatibility)
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission: Database["public"]["Enums"]["permission"];
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission: Database["public"]["Enums"]["permission"];
          role: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          id?: string;
          permission?: Database["public"]["Enums"]["permission"];
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          is_admin: boolean | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          is_admin?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_admin?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "user_info";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      user_info: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_custom_claims_to_jwt: {
        Args: { event: Json };
        Returns: Json;
      };
      current_user_permissions: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["permission"][];
      };
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      get_user_branch_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_profile_with_permissions: {
        Args: { user_id: string };
        Returns: Json;
      };
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: string };
        Returns: Database["public"]["Enums"]["user_role"];
      };
      get_user_role_for_middleware: {
        Args: { user_id: string };
        Returns: string;
      };
      has_permission: {
        Args: {
          required_permission: Database["public"]["Enums"]["permission"];
        };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      user_has_permission: {
        Args: {
          required_permission: Database["public"]["Enums"]["permission"];
          user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      permission:
        | "pos.access"
        | "inventory.access"
        | "customers.access"
        | "transactions.access"
        | "notifications.access"
        | "reports.access"
        | "settings.access"
        | "users.access"
        | "admin.access";
      user_role: "admin" | "shop";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

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
