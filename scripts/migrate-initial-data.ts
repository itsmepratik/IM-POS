/**
 * Migration script to populate Supabase with initial data from the app.
 * 
 * This script should be run once when setting up the database.
 * Run with: bun scripts/migrate-initial-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Initial data to migrate
const initialCategories = [
  "Oil",
  "Filters",
  "Parts",
  "Additives"
]

const initialBrands = [
  "Toyota",
  "Shell",
  "Castrol",
  "Mobil",
  "Valvoline",
  "Honda"
]

const initialSuppliers = [
  { name: "Toyota Parts Distributor", contact_info: "contact@toyotaparts.example.com" },
  { name: "Shell Distributors", contact_info: "sales@shelldistributors.example.com" }
]

// Initial items with mock data
const initialItems = [
  {
    name: "0W-20",
    category: "Oil",
    brand: "Toyota",
    type: "0W-20",
    price: 39.99,
    is_oil: true,
    sku: "TOY-OIL-0W20",
    description: "Genuine Toyota 0W-20 Synthetic Oil",
    image_url: "/oils/toyota-0w20.jpg",
    volumes: [
      { size: "5L", price: 39.99 },
      { size: "4L", price: 34.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 }
    ],
    batches: [
      {
        purchase_date: "2023-10-15",
        cost_price: 29.99,
        initial_quantity: 50,
        current_quantity: 50,
        supplier: "Toyota Parts Distributor",
        expiration_date: "2025-10-15"
      },
      {
        purchase_date: "2024-01-20",
        cost_price: 32.99,
        initial_quantity: 50,
        current_quantity: 50,
        supplier: "Toyota Parts Distributor",
        expiration_date: "2026-01-20"
      }
    ],
    bottle_states: { open: 5, closed: 5 }
  },
  {
    name: "5W-30",
    category: "Oil",
    brand: "Shell",
    type: "5W-30",
    price: 45.99,
    is_oil: true,
    sku: "SHL-OIL-5W30",
    description: "Shell Helix 5W-30 Synthetic Oil",
    image_url: "/oils/shell-5w30.jpg",
    volumes: [
      { size: "5L", price: 45.99 },
      { size: "4L", price: 39.99 },
      { size: "1L", price: 13.99 },
      { size: "500ml", price: 7.99 }
    ],
    batches: [
      {
        purchase_date: "2023-11-10",
        cost_price: 35.99,
        initial_quantity: 75,
        current_quantity: 75,
        supplier: "Shell Distributors",
        expiration_date: "2025-11-10"
      },
      {
        purchase_date: "2024-02-05",
        cost_price: 38.99,
        initial_quantity: 75,
        current_quantity: 75,
        supplier: "Shell Distributors",
        expiration_date: "2026-02-05"
      }
    ],
    bottle_states: { open: 5, closed: 5 }
  },
  {
    name: "Oil Filter - Premium",
    category: "Filters",
    brand: "Toyota",
    type: "Oil Filter",
    price: 19.99,
    sku: "TOY-FLT-OIL-P",
    description: "Premium Toyota Oil Filter",
    image_url: "/filters/toyota-oil-filter.jpg",
    stock: 75
  },
  {
    name: "Air Filter - Standard",
    category: "Filters",
    brand: "Honda",
    type: "Air Filter",
    price: 14.99,
    sku: "HON-FLT-AIR-S",
    description: "Standard Honda Air Filter",
    image_url: "/filters/honda-air-filter.jpg",
    stock: 50
  },
  {
    name: "Brake Pads",
    category: "Parts",
    price: 45.99,
    sku: "BRK-PAD-001",
    description: "High-performance brake pads",
    stock: 30
  },
  {
    name: "Fuel System Cleaner",
    category: "Additives",
    price: 14.99,
    sku: "ADD-FSC-001",
    description: "Professional fuel system cleaning solution",
    stock: 60
  }
]

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putvnnpptgiupfsohggq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHZubnBwdGdpdXBmc29oZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODUxMzQsImV4cCI6MjA1NDI2MTEzNH0.i4x7TVrZo2gqIInWS-0uBJNxNWlnoItM0YmypbrpIw4'
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Main migration function
async function migrateData() {
  try {
    console.log('Starting migration of initial data to Supabase...')
    
    // Step 1: Make sure the Main Branch exists (should have been created during schema setup)
    const { data: branchData } = await supabase
      .from('branches')
      .select('id')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single()
    
    if (!branchData) {
      console.log('Creating Main Branch...')
      await supabase
        .from('branches')
        .insert({ id: '00000000-0000-0000-0000-000000000000', name: 'Main Branch' })
    }
    
    // Step 2: Migrate Categories
    console.log('Migrating categories...')
    const categoryIdMap = new Map<string, string>() // name -> id
    
    for (const category of initialCategories) {
      const { data: existingCat } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .maybeSingle()
      
      if (existingCat) {
        categoryIdMap.set(category, existingCat.id)
      } else {
        const { data: newCat, error } = await supabase
          .from('categories')
          .insert({ name: category })
          .select()
          .single()
        
        if (error) {
          console.error(`Error adding category ${category}:`, error)
        } else if (newCat) {
          categoryIdMap.set(category, newCat.id)
        }
      }
    }
    
    // Step 3: Migrate Brands
    console.log('Migrating brands...')
    const brandIdMap = new Map<string, string>() // name -> id
    
    for (const brand of initialBrands) {
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('name', brand)
        .maybeSingle()
      
      if (existingBrand) {
        brandIdMap.set(brand, existingBrand.id)
      } else {
        const { data: newBrand, error } = await supabase
          .from('brands')
          .insert({ name: brand })
          .select()
          .single()
        
        if (error) {
          console.error(`Error adding brand ${brand}:`, error)
        } else if (newBrand) {
          brandIdMap.set(brand, newBrand.id)
        }
      }
    }
    
    // Step 4: Migrate Suppliers
    console.log('Migrating suppliers...')
    const supplierIdMap = new Map<string, string>() // name -> id
    
    for (const supplier of initialSuppliers) {
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', supplier.name)
        .maybeSingle()
      
      if (existingSupplier) {
        supplierIdMap.set(supplier.name, existingSupplier.id)
      } else {
        const { data: newSupplier, error } = await supabase
          .from('suppliers')
          .insert(supplier)
          .select()
          .single()
        
        if (error) {
          console.error(`Error adding supplier ${supplier.name}:`, error)
        } else if (newSupplier) {
          supplierIdMap.set(supplier.name, newSupplier.id)
        }
      }
    }
    
    // Step 5: Migrate Items and related data
    console.log('Migrating items...')
    const branchId = '00000000-0000-0000-0000-000000000000' // Main Branch
    
    for (const item of initialItems) {
      // Create the item
      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert({
          name: item.name,
          category_id: item.category ? categoryIdMap.get(item.category) : null,
          brand_id: item.brand ? brandIdMap.get(item.brand) : null,
          price: item.price,
          type: item.type || null,
          image_url: item.image_url || null,
          sku: item.sku || null,
          description: item.description || null,
          is_oil: item.is_oil || false
        })
        .select()
        .single()
      
      if (itemError) {
        console.error(`Error adding item ${item.name}:`, itemError)
        continue
      }
      
      if (!newItem) {
        console.error(`Failed to create item ${item.name}`)
        continue
      }
      
      console.log(`Added item: ${item.name} (${newItem.id})`)
      
      // Add volumes if this is an oil product
      if (item.is_oil && item.volumes) {
        const volumesData = item.volumes.map(vol => ({
          item_id: newItem.id,
          size: vol.size,
          price: vol.price
        }))
        
        const { error: volumesError } = await supabase
          .from('item_volumes')
          .insert(volumesData)
        
        if (volumesError) {
          console.error(`Error adding volumes for ${item.name}:`, volumesError)
        } else {
          console.log(`Added ${volumesData.length} volumes for ${item.name}`)
        }
      }
      
      // Add batches if provided
      if (item.batches && item.batches.length > 0) {
        for (const batch of item.batches) {
          const { data: newBatch, error: batchError } = await supabase
            .from('batches')
            .insert({
              item_id: newItem.id,
              purchase_date: batch.purchase_date,
              cost_price: batch.cost_price,
              initial_quantity: batch.initial_quantity,
              current_quantity: batch.current_quantity,
              supplier_id: batch.supplier ? supplierIdMap.get(batch.supplier) : null,
              expiration_date: batch.expiration_date || null
            })
            .select()
            .single()
          
          if (batchError) {
            console.error(`Error adding batch for ${item.name}:`, batchError)
            continue
          }
          
          if (!newBatch) {
            console.error(`Failed to create batch for ${item.name}`)
            continue
          }
          
          // Add branch inventory record for this batch
          const { error: invError } = await supabase
            .from('branch_inventory')
            .insert({
              branch_id: branchId,
              item_id: newItem.id,
              batch_id: newBatch.id,
              quantity: newBatch.current_quantity
            })
          
          if (invError) {
            console.error(`Error adding branch inventory for batch of ${item.name}:`, invError)
          }
        }
        
        console.log(`Added ${item.batches.length} batches for ${item.name}`)
      }
      
      // Add branch inventory record (for oil bottle states or regular stock)
      const branchInventoryData: {
        branch_id: string;
        item_id: string;
        quantity: number;
        open_bottles?: number;
        closed_bottles?: number;
      } = {
        branch_id: branchId,
        item_id: newItem.id,
        quantity: item.is_oil && item.bottle_states 
          ? item.bottle_states.open + item.bottle_states.closed 
          : (item.stock || 0)
      }
      
      if (item.is_oil && item.bottle_states) {
        branchInventoryData.open_bottles = item.bottle_states.open
        branchInventoryData.closed_bottles = item.bottle_states.closed
      }
      
      const { error: biError } = await supabase
        .from('branch_inventory')
        .insert(branchInventoryData)
      
      if (biError) {
        console.error(`Error adding branch inventory for ${item.name}:`, biError)
      }
    }
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Run the migration
migrateData() 