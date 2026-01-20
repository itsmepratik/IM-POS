
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function reproduceBug() {
  console.log('--- REPRODUCING OPEN BOTTLE CHECKOUT BUG ---');

  // 1. Find a lubricant product with batches and open bottles
  // We'll calculate stock manually to compare
  const { data: item, error: itemError } = await supabase
    .from('inventory')
    .select(`
      *,
      closed_bottles_stock,
      open_bottles_stock,
      products!inner (
        id, name, product_type
      ),
      batches (
        id, stock_remaining
      ),
      open_bottle_details (
        id, current_volume, is_empty
      )
    `)
    .ilike('products.name', '%W-%') // Common oil pattern
    .gt('batches.stock_remaining', 0) // Ensure it has stock
    .limit(1);

  if (itemError || !item || item.length === 0) {
    console.error('Failed to fetch item:', itemError);
    return;
  }
  
  const targetItem = item[0];

  // Fetch product volumes to debug bottle size detection
  const { data: volumes } = await supabase
    .from('product_volumes')
    .select('volume_description')
    .eq('product_id', targetItem.product_id);
    
  console.log(`Product Volumes for ${targetItem.products.name}:`, volumes);

  const initialBatchStock = targetItem.closed_bottles_stock; // Use specific column
  const initialOpenVolume = targetItem.open_bottle_details.reduce((sum, b) => sum + (Number(b.current_volume) || 0), 0);
  
  console.log(`Initial State for ${targetItem.products.name}:`);
  console.log(`- Closed Stock: ${initialBatchStock}`);
  console.log(`- Open Stock: ${targetItem.open_bottles_stock}`);
  console.log(`- Open Volume: ${initialOpenVolume} L`);

  // Fetch valid shop ID
  const { data: shopData } = await supabase
    .from('shops')
    .select('id')
    .eq('location_id', targetItem.location_id)
    .single();
    
  let validShopId = shopData?.id;
  if (!validShopId) {
      // Fallback
      const { data: anyShop } = await supabase.from('shops').select('id').limit(1).single();
      validShopId = anyShop?.id;
  }
  
  if (!validShopId) {
      console.error('No valid shop found');
      return;
  }
  console.log(`Using Shop ID: ${validShopId}`);

  // ---------------------------------------------------------
  // TEST 1: Checkout 1L from CLOSED Bottle (Partial Sale)
  // Expectation: Closed -1, Open +1 (New 3L bottle)
  // ---------------------------------------------------------
  const SELL_QUANTITY_CLOSED = 1;
  const SELL_VOLUME_STR_CLOSED = '1L';

  console.log(`\n[TEST 1] Simulating Checkout of ${SELL_QUANTITY_CLOSED} unit(s) of ${SELL_VOLUME_STR_CLOSED} from CLOSED Bottle...`);
  
  const payloadClosed = {
    locationId: targetItem.location_id,
    shopId: validShopId,
    cashierId: null,
    items: [{
      productId: targetItem.product_id,
      quantity: SELL_QUANTITY_CLOSED, 
      source: 'CLOSED',
      volumeDescription: SELL_VOLUME_STR_CLOSED 
    }],
    totalAmount: 0,
    paymentMethod: 'CASH',
    type: 'SALE'
  };

  const { data: resultClosed, error: rpcErrorClosed } = await supabase.rpc('create_checkout_transaction', {
    p_location_id: payloadClosed.locationId,
    p_shop_id: payloadClosed.shopId,
    p_cashier_id: payloadClosed.cashierId,
    p_items: payloadClosed.items,
    p_total_amount: 0, // arguments...
    p_payment_method: 'CASH',
    p_type: 'SALE'
  });

  if (rpcErrorClosed) {
    console.error('Test 1 Failed:', rpcErrorClosed);
    return;
  }
  console.log('Test 1 Checkout successful:', resultClosed);

  // Verify Test 1
  const { data: itemAfterTest1 } = await supabase
    .from('inventory')
    .select(`*, closed_bottles_stock, open_bottles_stock, open_bottle_details(*)`)
    .eq('id', targetItem.id)
    .single();

  const closedDiff = initialBatchStock - itemAfterTest1.closed_bottles_stock;
  const openStockDiff = itemAfterTest1.open_bottles_stock - initialBatchStock; // wait, variable mismatch
  const openStockDiffReal = itemAfterTest1.open_bottles_stock - targetItem.open_bottles_stock;

  if (closedDiff === 1 && openStockDiffReal === 1) {
       console.log('✅ TEST 1 PASSED: Closed -1, Open +1.');
  } else {
       console.error(`❌ TEST 1 FAILED: Closed Diff ${closedDiff}, Open Diff ${openStockDiffReal}`);
  }

  // ---------------------------------------------------------
  // TEST 2: Checkout 2 units of 0.25L from OPEN Bottle
  // Expectation: Open Volume decreases by 0.5L
  // ---------------------------------------------------------
  const SELL_QUANTITY = 2; // Test 2 units
  const SELL_VOLUME_STR = '0.25L';
  const EXPECTED_DEDUCTION = 0.5; // 2 * 0.25
  const initialOpenVolumeTest2 = itemAfterTest1.open_bottle_details.reduce((sum, b) => sum + (Number(b.current_volume) || 0), 0);

  console.log(`\n[TEST 2] Simulating Checkout of ${SELL_QUANTITY} unit(s) of ${SELL_VOLUME_STR} from OPEN Bottle...`);
  console.log(`Expectation: Open stock volume should decrease by ${EXPECTED_DEDUCTION}L.`);
  
  const payload = {
    locationId: targetItem.location_id,
    shopId: validShopId,
    cashierId: null,
    items: [{
      productId: targetItem.product_id,
      quantity: SELL_QUANTITY, 
      source: 'OPEN', 
      volumeDescription: SELL_VOLUME_STR 
    }],
    totalAmount: 0,
    paymentMethod: 'CASH',
    type: 'SALE'
  };

  const { data: result, error: rpcError } = await supabase.rpc('create_checkout_transaction', {
    p_location_id: payload.locationId,
    p_shop_id: payload.shopId,
    p_cashier_id: payload.cashierId,
    p_items: payload.items,
    p_total_amount: 0,
    p_payment_method: 'CASH',
    p_type: 'SALE'
  });

  if (rpcError) {
    console.error('Checkout failed:', rpcError);
    return;
  }

  console.log('Checkout successful:', result);

  // 3. Verify Post-Checkout State
  const { data: newItem, error: newItemError } = await supabase
    .from('inventory')
    .select(`
      standard_stock,
      closed_bottles_stock,
      open_bottles_stock,
      batches (id, stock_remaining),
      open_bottle_details (id, current_volume, is_empty, opened_at)
    `)
    .eq('id', targetItem.id)
    .single();

  const newOpenVolume = newItem.open_bottle_details.reduce((sum, b) => sum + (Number(b.current_volume) || 0), 0);
  
  console.log(`\nPost-Checkout State:`);
  console.log(`- Open Volume: ${initialOpenVolumeTest2} -> ${newOpenVolume}`);
  
  const volumeDiff = initialOpenVolumeTest2 - newOpenVolume;
  
  if (Math.abs(volumeDiff - EXPECTED_DEDUCTION) < 0.01) {
      console.log(`✅ TEST 2 PASSED: Volume reduced by ${volumeDiff}L (Expected ${EXPECTED_DEDUCTION}L).`);
  } else {
      console.error(`❌ TEST 2 FAILED: Volume reduced by ${volumeDiff}L (Expected ${EXPECTED_DEDUCTION}L).`);
  }
}

reproduceBug();
