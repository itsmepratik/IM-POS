import { supabase } from '../supabaseClient'
import { Tables, TablesInsert, TablesUpdate, Views } from '@/types/supabase'

// Type definitions based on our database schema
export type Item = Tables<'items'> & {
  volumes?: Volume[]
  batches?: Batch[]
  stock?: number
  bottleStates?: BottleStates
  category?: string
  brand?: string
}

export type Volume = Tables<'item_volumes'>
export type Batch = Tables<'batches'>
export type Brand = Tables<'brands'>
export type Category = Tables<'categories'>
export type Supplier = Tables<'suppliers'>
export type Branch = Tables<'branches'>
export type BranchInventory = Tables<'branch_inventory'>
export type InventoryView = Views<'inventory_view'>

export type BottleStates = {
  open: number
  closed: number
}

// Service functions for items
export const fetchItems = async (branchId: string): Promise<Item[]> => {
  const { data: inventoryView, error: inventoryError } = await supabase
    .from('inventory_view')
    .select('*')
    .eq('branch_id', branchId)
  
  if (inventoryError) {
    console.error('Error fetching inventory view:', inventoryError)
    throw inventoryError
  }

  // Group inventory view results by item_id
  const itemsMap = new Map<string, Item>()
  
  inventoryView.forEach((row) => {
    if (!row.item_id) return
    
    if (!itemsMap.has(row.item_id)) {
      itemsMap.set(row.item_id, {
        id: row.item_id,
        name: row.item_name || '',
        price: row.price || 0,
        category_id: null,
        category: row.category || '',
        brand_id: null,
        brand: row.brand || '',
        type: row.type || null,
        is_oil: row.is_oil || false,
        stock: row.stock || 0,
        bottleStates: row.is_oil ? {
          open: row.open_bottles || 0,
          closed: row.closed_bottles || 0
        } : undefined,
        created_at: null,
        updated_at: null,
        description: null,
        image_url: null,
        sku: null
      })
    }
  })

  // Convert map to array
  const items = Array.from(itemsMap.values())

  // Fetch volumes for oil items
  const oilItemIds = items.filter(item => item.is_oil).map(item => item.id)
  
  if (oilItemIds.length > 0) {
    const { data: volumes, error: volumesError } = await supabase
      .from('item_volumes')
      .select('*')
      .in('item_id', oilItemIds)
    
    if (volumesError) {
      console.error('Error fetching volumes:', volumesError)
    } else if (volumes) {
      // Group volumes by item_id
      const volumesMap = new Map<string, Volume[]>()
      
      volumes.forEach(volume => {
        if (!volumesMap.has(volume.item_id)) {
          volumesMap.set(volume.item_id, [])
        }
        volumesMap.get(volume.item_id)?.push(volume)
      })
      
      // Assign volumes to items
      items.forEach(item => {
        if (volumesMap.has(item.id)) {
          item.volumes = volumesMap.get(item.id)
        }
      })
    }
  }

  // Fetch batches for all items
  const { data: batches, error: batchesError } = await supabase
    .from('batches')
    .select('*')
    .in('item_id', items.map(item => item.id))
  
  if (batchesError) {
    console.error('Error fetching batches:', batchesError)
  } else if (batches) {
    // Group batches by item_id
    const batchesMap = new Map<string, Batch[]>()
    
    batches.forEach(batch => {
      if (!batchesMap.has(batch.item_id)) {
        batchesMap.set(batch.item_id, [])
      }
      batchesMap.get(batch.item_id)?.push(batch)
    })
    
    // Assign batches to items
    items.forEach(item => {
      if (batchesMap.has(item.id)) {
        item.batches = batchesMap.get(item.id)
      }
    })
  }

  return items
}

export const fetchItem = async (id: string, branchId: string): Promise<Item | null> => {
  // Fetch the item's core data
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select(`
      *,
      categories(name),
      brands(name)
    `)
    .eq('id', id)
    .single()
  
  if (itemError) {
    console.error('Error fetching item:', itemError)
    return null
  }
  
  if (!item) return null

  // Fetch inventory data for this item in the specified branch
  const { data: inventory, error: invError } = await supabase
    .from('branch_inventory')
    .select('*')
    .eq('item_id', id)
    .eq('branch_id', branchId)
    .is('batch_id', null)
    .maybeSingle()

  // Fetch volumes for the item (if it's an oil)
  const { data: volumes, error: volError } = await supabase
    .from('item_volumes')
    .select('*')
    .eq('item_id', id)
  
  if (volError) {
    console.error('Error fetching volumes:', volError)
  }

  // Fetch batches for the item
  const { data: batches, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('item_id', id)
    .order('purchase_date', { ascending: true })
  
  if (batchError) {
    console.error('Error fetching batches:', batchError)
  }

  // Construct the complete item with all related data
  const result: Item = {
    ...item,
    category: item.categories?.name || '',
    brand: item.brands?.name || '',
    stock: inventory?.quantity || 0,
    bottleStates: item.is_oil ? {
      open: inventory?.open_bottles || 0,
      closed: inventory?.closed_bottles || 0
    } : undefined,
    volumes: volumes || undefined,
    batches: batches || undefined
  }

  return result
}

export const createItem = async (item: Omit<Item, 'id'>, branchId: string): Promise<Item | null> => {
  try {
    console.log('Creating item with branch ID:', branchId);
    
    if (!branchId) {
      console.error('Error creating item: No branch ID provided');
      return null;
    }

    // Debug authentication status
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error checking authentication session:', sessionError);
    } else {
      console.log('Auth session:', sessionData.session ? 'Authenticated' : 'Not authenticated');
    }

    // 1. Extract data for different tables
    const itemData: TablesInsert<'items'> = {
      name: item.name,
      category_id: item.category_id || null,
      brand_id: item.brand_id || null,
      price: typeof item.price === 'number' ? item.price : 0,
      type: item.type || null,
      image_url: item.image_url || null,
      sku: item.sku || null,
      description: item.description || null,
      is_oil: typeof item.is_oil === 'boolean' ? item.is_oil : false
    }

    console.log('Item data to insert:', itemData);

    // 2. Insert the main item - separate insert from select
    const { error: insertError, data: insertResponse } = await supabase
      .from('items')
      .insert(itemData)
      .select('id');
    
    if (insertError) {
      // Enhanced error logging
      console.error('Error creating item in database:', JSON.stringify(insertError, null, 2), {
        itemData
      });
      return null;
    }
    
    if (!insertResponse || insertResponse.length === 0) {
      console.error('No item ID returned after insert');
      return null;
    }

    const newItemId = insertResponse[0].id;
    console.log('Item created successfully:', newItemId);

    // 3. Insert volumes if it's an oil product
    if (item.is_oil && item.volumes && item.volumes.length > 0) {
      const volumesData = item.volumes.map(volume => ({
        item_id: newItemId,
        size: volume.size,
        price: volume.price
      }));

      const { error: volumesError } = await supabase
        .from('item_volumes')
        .insert(volumesData);
      
      if (volumesError) {
        console.error('Error creating volumes:', JSON.stringify(volumesError, null, 2));
      }
    }

    // 4. Insert batches if provided
    if (item.batches && item.batches.length > 0) {
      const batchesData = item.batches.map(batch => ({
        item_id: newItemId,
        purchase_date: batch.purchase_date,
        cost_price: batch.cost_price,
        initial_quantity: batch.initial_quantity || batch.current_quantity,
        current_quantity: batch.current_quantity,
        supplier_id: batch.supplier_id,
        expiration_date: batch.expiration_date
      }));

      const { data: newBatches, error: batchesError } = await supabase
        .from('batches')
        .insert(batchesData)
        .select();
      
      if (batchesError) {
        console.error('Error creating batches:', JSON.stringify(batchesError, null, 2));
      } else {
        // 5. Insert branch inventory records for the batches
        if (newBatches && newBatches.length > 0) {
          const branchInventoryBatchRecords = newBatches.map(batch => ({
            branch_id: branchId,
            item_id: newItemId,
            batch_id: batch.id,
            quantity: batch.current_quantity
          }));

          const { error: biError } = await supabase
            .from('branch_inventory')
            .insert(branchInventoryBatchRecords);
          
          if (biError) {
            console.error('Error creating branch inventory batch records:', JSON.stringify(biError, null, 2));
          }
        }
      }
    }

    // 6. Insert branch inventory record (for non-batch inventory or oil bottle states)
    const branchInventoryData: TablesInsert<'branch_inventory'> = {
      branch_id: branchId,
      item_id: newItemId,
      quantity: item.is_oil && item.bottleStates 
        ? item.bottleStates.open + item.bottleStates.closed 
        : (item.batches ? 0 : item.stock || 0),
      open_bottles: item.is_oil && item.bottleStates ? item.bottleStates.open : null,
      closed_bottles: item.is_oil && item.bottleStates ? item.bottleStates.closed : null
    };

    console.log('Creating branch inventory record:', branchInventoryData);

    const { error: biError } = await supabase
      .from('branch_inventory')
      .insert(branchInventoryData);
    
    if (biError) {
      console.error('Error creating branch inventory record:', JSON.stringify(biError, null, 2));
    }

    // Return the newly created item
    console.log('Fetching complete item data');
    return await fetchItem(newItemId, branchId);
  } catch (error) {
    console.error('Unexpected error in createItem:', error);
    return null;
  }
}

export const updateItem = async (id: string, item: Partial<Item>, branchId: string): Promise<Item | null> => {
  try {
    console.log('Updating item with ID:', id, 'and branch ID:', branchId);
    
    // Debug authentication status
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error checking authentication session:', sessionError);
    } else {
      console.log('Auth session:', sessionData.session ? 'Authenticated' : 'Not authenticated');
    }
    
    // 1. Update the main item record
    const itemData: TablesUpdate<'items'> = {
      name: item.name,
      category_id: item.category_id,
      brand_id: item.brand_id,
      price: item.price,
      type: item.type,
      image_url: item.image_url,
      sku: item.sku,
      description: item.description,
      is_oil: item.is_oil
    }

    console.log('Item data to update:', itemData);

    // Separate the update operation from the select operation to avoid PGRST116 error
    // First, perform the update without trying to return data
    const { error: updateError } = await supabase
      .from('items')
      .update(itemData)
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating item in database:', JSON.stringify(updateError, null, 2), {
        itemData
      });
      return null;
    }
    
    // If update succeeded, fetch the updated item separately
    const { data: updatedItem, error: selectError } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
      
    if (selectError || !updatedItem) {
      console.error('Error fetching updated item:', JSON.stringify(selectError, null, 2));
      return null;
    }

    console.log('Item updated successfully:', updatedItem.id);

    // 2. Handle volumes updates if this is an oil product
    if (item.is_oil && item.volumes) {
      // First, delete existing volumes
      const { error: delVolError } = await supabase
        .from('item_volumes')
        .delete()
        .eq('item_id', id)
      
      if (delVolError) {
        console.error('Error deleting existing volumes:', JSON.stringify(delVolError, null, 2));
      }

      // Then, insert new volumes
      if (item.volumes.length > 0) {
        const volumesData = item.volumes.map(volume => ({
          item_id: id,
          size: volume.size,
          price: volume.price
        }));

        const { error: volumesError } = await supabase
          .from('item_volumes')
          .insert(volumesData);
        
        if (volumesError) {
          console.error('Error updating volumes:', JSON.stringify(volumesError, null, 2));
        }
      }
    }

    // 3. Update branch inventory for bottle states (if oil) or non-batch inventory
    if ((item.is_oil && item.bottleStates) || (!item.batches && item.stock !== undefined)) {
      const { data: existingInv, error: getInvError } = await supabase
        .from('branch_inventory')
        .select('id')
        .eq('branch_id', branchId)
        .eq('item_id', id)
        .is('batch_id', null)
        .maybeSingle();
      
      if (getInvError) {
        console.error('Error fetching existing inventory:', JSON.stringify(getInvError, null, 2));
      }
      
      const invData: TablesUpdate<'branch_inventory'> = {
        quantity: item.is_oil && item.bottleStates 
          ? item.bottleStates.open + item.bottleStates.closed 
          : (item.stock || 0),
        open_bottles: item.is_oil && item.bottleStates ? item.bottleStates.open : null,
        closed_bottles: item.is_oil && item.bottleStates ? item.bottleStates.closed : null
      }

      console.log('Branch inventory data to update:', invData);

      if (existingInv) {
        // Update existing record
        const { error: updateInvError } = await supabase
          .from('branch_inventory')
          .update(invData)
          .eq('id', existingInv.id);
        
        if (updateInvError) {
          console.error('Error updating branch inventory:', JSON.stringify(updateInvError, null, 2));
        }
      } else {
        // Insert new record
        const { error: insertInvError } = await supabase
          .from('branch_inventory')
          .insert({
            ...invData,
            branch_id: branchId,
            item_id: id
          });
        
        if (insertInvError) {
          console.error('Error creating branch inventory:', JSON.stringify(insertInvError, null, 2));
        }
      }
    }

    // Return the updated item
    return await fetchItem(id, branchId);
  } catch (error) {
    console.error('Unexpected error in updateItem:', error);
    return null;
  }
}

export const deleteItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting item:', error)
    return false
  }
  
  return true
}

// Service functions for batches
export const addBatch = async (
  itemId: string, 
  batchData: {
    purchase_date: string,
    cost_price: number,
    initial_quantity: number,
    current_quantity: number,
    supplier_id: string | null,
    expiration_date: string | null
  }, 
  branchId: string
): Promise<boolean> => {
  try {
    console.log('Adding batch with data:', batchData);
    
    // 1. Insert the new batch
    const { data: newBatch, error: batchError } = await supabase
      .from('batches')
      .insert({
        item_id: itemId,
        purchase_date: batchData.purchase_date,
        cost_price: batchData.cost_price,
        initial_quantity: batchData.initial_quantity,
        current_quantity: batchData.current_quantity,
        supplier_id: batchData.supplier_id || null,
        expiration_date: batchData.expiration_date || null
      })
      .select()
      .single()
    
    if (batchError || !newBatch) {
      console.error('Error adding batch:', batchError)
      return false
    }

    // 2. Add branch inventory record for this batch
    const { error: invError } = await supabase
      .from('branch_inventory')
      .insert({
        branch_id: branchId,
        item_id: itemId,
        batch_id: newBatch.id,
        quantity: newBatch.current_quantity
      })
    
    if (invError) {
      console.error('Error adding branch inventory for batch:', invError)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error in addBatch:', error)
    return false
  }
}

export const updateBatch = async (
  itemId: string,
  batchId: string, 
  batchData: Partial<{
    purchase_date: string,
    cost_price: number,
    initial_quantity: number,
    current_quantity: number,
    supplier_id: string | null,
    expiration_date: string | null
  }>,
  branchId: string
): Promise<boolean> => {
  try {
    console.log('Updating batch with data:', batchData);
    
    // 1. Update the batch record
    const { error: batchError } = await supabase
      .from('batches')
      .update(batchData)
      .eq('id', batchId)
    
    if (batchError) {
      console.error('Error updating batch:', batchError)
      return false
    }

    // 2. Update the branch inventory record for this batch
    if (batchData.current_quantity !== undefined) {
      const { error: invError } = await supabase
        .from('branch_inventory')
        .update({
          quantity: batchData.current_quantity
        })
        .eq('branch_id', branchId)
        .eq('item_id', itemId)
        .eq('batch_id', batchId)
      
      if (invError) {
        console.error('Error updating branch inventory for batch:', invError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Unexpected error in updateBatch:', error)
    return false
  }
}

export const deleteBatch = async (
  itemId: string, 
  batchId: string, 
  branchId: string
): Promise<boolean> => {
  // Delete the branch inventory record first (foreign key constraint)
  const { error: invError } = await supabase
    .from('branch_inventory')
    .delete()
    .eq('branch_id', branchId)
    .eq('item_id', itemId)
    .eq('batch_id', batchId)
  
  if (invError) {
    console.error('Error deleting branch inventory for batch:', invError)
    return false
  }

  // Delete the batch record
  const { error: batchError } = await supabase
    .from('batches')
    .delete()
    .eq('id', batchId)
  
  if (batchError) {
    console.error('Error deleting batch:', batchError)
    return false
  }

  return true
}

// Service functions for categories
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
  
  return data
}

export const addCategory = async (name: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding category:', error)
    return null
  }
  
  return data
}

export const updateCategory = async (id: string, name: string): Promise<boolean> => {
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating category:', error)
    return false
  }
  
  return true
}

export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting category:', error)
    return false
  }
  
  return true
}

// Service functions for brands
export const fetchBrands = async (): Promise<Brand[]> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching brands:', error)
    throw error
  }
  
  return data
}

export const addBrand = async (name: string): Promise<Brand | null> => {
  const { data, error } = await supabase
    .from('brands')
    .insert({ name })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding brand:', error)
    return null
  }
  
  return data
}

export const updateBrand = async (id: string, name: string): Promise<boolean> => {
  const { error } = await supabase
    .from('brands')
    .update({ name })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating brand:', error)
    return false
  }
  
  return true
}

export const deleteBrand = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting brand:', error)
    return false
  }
  
  return true
}

// Service functions for branches
export const fetchBranches = async (): Promise<Branch[]> => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching branches:', error)
    throw error
  }
  
  return data
}

export const addBranch = async (branch: TablesInsert<'branches'>): Promise<Branch | null> => {
  const { data, error } = await supabase
    .from('branches')
    .insert(branch)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding branch:', error)
    return null
  }
  
  return data
}

export const updateBranch = async (id: string, branch: TablesUpdate<'branches'>): Promise<boolean> => {
  const { error } = await supabase
    .from('branches')
    .update(branch)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating branch:', error)
    return false
  }
  
  return true
}

export const deleteBranch = async (id: string): Promise<boolean> => {
  // Don't allow deleting the main branch
  if (id === '00000000-0000-0000-0000-000000000000') {
    return false
  }
  
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting branch:', error)
    return false
  }
  
  return true
}

// Service functions for suppliers
export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching suppliers:', error)
    throw error
  }
  
  return data
}

export const addSupplier = async (name: string, contactInfo?: string): Promise<Supplier | null> => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ 
      name,
      contact_info: contactInfo 
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding supplier:', error)
    return null
  }
  
  return data
}

export const updateSupplier = async (id: string, name: string, contactInfo?: string): Promise<boolean> => {
  const { error } = await supabase
    .from('suppliers')
    .update({ 
      name,
      contact_info: contactInfo 
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating supplier:', error)
    return false
  }
  
  return true
}

export const deleteSupplier = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting supplier:', error)
    return false
  }
  
  return true
} 