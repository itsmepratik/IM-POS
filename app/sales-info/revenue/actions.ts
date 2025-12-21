'use server'

import { createClient } from "@/supabase/server"

export interface SaleVariant {
  size: string
  quantity: number
  unitPrice: number
  totalSales: number
}

export interface SaleItem {
  name: string
  category: "fluid" | "part" | "service"
  quantity: number
  unitPrice: number
  totalSales: number
  storeId: string
  variants?: SaleVariant[]
}

export interface Store {
  id: string
  name: string
}

export async function getRevenueData() {
  const supabase = await createClient()

  // Fetch basic data
  const { data: stores } = await supabase.from('shops').select('id, name')
  const { data: products } = await supabase.from('products').select('id, name, type_id')
  const { data: types } = await supabase.from('types').select('id, name, category_id')
  const { data: categories } = await supabase.from('categories').select('id, name')

  // Get start of today (00:00:00)
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  // Fetch transactions
  // Filter for SALE type transactions created today
  const { data: transactions } = await supabase
    .from('transactions')
    .select('items_sold, shop_id')
    .eq('type', 'SALE')
    .gte('created_at', startOfDay.toISOString())

  if (!transactions || !products || !types || !categories || !stores) {
    return { items: [], stores: [] }
  }

  // Create lookups
  const productMap = new Map(products.map(p => [p.id, p]))
  const typeMap = new Map(types.map(t => [t.id, t]))
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  
  // Helper to get category name for a product
  const getCategoryName = (productId: string): "fluid" | "part" | "service" => {
    const product = productMap.get(productId)
    if (!product) return 'part' // default

    // Try to get category from relationships first
    let catName: string | undefined
    const type = typeMap.get(product.type_id)
    if (type) {
      catName = categoryMap.get(type.category_id)
    }
    
    if (catName) {
      const lower = catName.toLowerCase()
      if (lower.includes('fluid') || lower.includes('oil') || lower.includes('lubricant') || lower.includes('additive')) return 'fluid'
      if (lower.includes('part') || lower.includes('filter')) return 'part'
      if (lower.includes('service')) return 'service'
    }

    // Fallback: Check product name if category lookup failed
    const lowerName = product.name.toLowerCase()
    // Match common viscosity patterns (e.g., 0w-20, 5w30), oil, layout, etc.
    if (/\d+w-?\d+/i.test(lowerName) || lowerName.includes('oil') || lowerName.includes('fluid') || lowerName.includes('lubricant')) {
        return 'fluid'
    }
    
    return 'part'
  }

  // Aggregate data
  const itemMap = new Map<string, SaleItem>()

  transactions.forEach(tx => {
    const storeId = tx.shop_id || 'all-stores' // Fallback if null, though likely not null
    const items = tx.items_sold as any[] // cast jsonb

    if (Array.isArray(items)) {
      items.forEach(item => {
        const productId = item.productId
        const product = productMap.get(productId)
        const name = product ? product.name : (item.name || 'Unknown Item') // Use item.name if available in JSON as fallback
        const category = getCategoryName(productId)
        const quantity = Number(item.quantity) || 0
        const price = Number(item.sellingPrice) || 0
        // Determine variant info if available (e.g. volumeDescription)
        const variantName = item.volumeDescription || item.size || null

        // Key combines name, store, and category to ensure uniqueness
        const key = `${name}-${storeId}`

        if (!itemMap.has(key)) {
            itemMap.set(key, {
                name,
                category,
                quantity: 0,
                unitPrice: price, 
                totalSales: 0,
                storeId,
                variants: []
            })
        }

        const entry = itemMap.get(key)!
        entry.quantity += quantity
        entry.totalSales += (quantity * price)
        // Update average unit price
        if (entry.quantity > 0) {
            entry.unitPrice = entry.totalSales / entry.quantity
        }

        if (variantName) {
            let variant = entry.variants?.find(v => v.size === variantName)
            if (!variant) {
                if (!entry.variants) entry.variants = []
                variant = { size: variantName, quantity: 0, unitPrice: price, totalSales: 0 }
                entry.variants.push(variant)
            }
            variant.quantity += quantity
            variant.totalSales += (quantity * price)
            if (variant.quantity > 0) {
                variant.unitPrice = variant.totalSales / variant.quantity
            }
        }
      })
    }
  })

  // Format stores list to match expected format primarily, adding 'All Stores' is handled in UI or here?
  // UI likely handles "All Stores" selection logic, but the list of available stores comes from here.
  const formattedStores = stores.map(s => ({ id: s.id, name: s.name }))

  return {
    items: Array.from(itemMap.values()),
    stores: formattedStores
  }
}
