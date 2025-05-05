export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batches: {
        Row: {
          cost_price: number
          created_at: string | null
          current_quantity: number
          expiration_date: string | null
          id: string
          initial_quantity: number
          item_id: string
          purchase_date: string
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          cost_price?: number
          created_at?: string | null
          current_quantity?: number
          expiration_date?: string | null
          id?: string
          initial_quantity?: number
          item_id: string
          purchase_date: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cost_price?: number
          created_at?: string | null
          current_quantity?: number
          expiration_date?: string | null
          id?: string
          initial_quantity?: number
          item_id?: string
          purchase_date?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      location_stock: {
        Row: {
          batch_id: string | null
          branch_id: string
          closed_bottles: number | null
          created_at: string | null
          id: string
          item_id: string
          open_bottles: number | null
          quantity: number
          updated_at: string | null
        }
        Insert: {
          batch_id?: string | null
          branch_id: string
          closed_bottles?: number | null
          created_at?: string | null
          id?: string
          item_id: string
          open_bottles?: number | null
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          batch_id?: string | null
          branch_id?: string
          closed_bottles?: number | null
          created_at?: string | null
          id?: string
          item_id?: string
          open_bottles?: number | null
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_stock_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "location_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "location_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      item_volumes: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          price: number
          size: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          price?: number
          size: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          price?: number
          size?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_volumes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "item_volumes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_oil: boolean | null
          name: string
          price: number
          sku: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_oil?: boolean | null
          name: string
          price?: number
          sku?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_oil?: boolean | null
          name?: string
          price?: number
          sku?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_info: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      inventory_view: {
        Row: {
          avg_cost_price: number | null
          branch_id: string | null
          branch_name: string | null
          brand: string | null
          category: string | null
          closed_bottles: number | null
          is_oil: boolean | null
          item_id: string | null
          item_name: string | null
          open_bottles: number | null
          price: number | null
          stock: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_average_cost: {
        Args: { p_item_id: string }
        Returns: number
      }
      get_item_stock: {
        Args: { p_item_id: string; p_branch_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Update"]

export type Views<
  T extends keyof Database["public"]["Views"]
> = Database["public"]["Views"][T]["Row"] 