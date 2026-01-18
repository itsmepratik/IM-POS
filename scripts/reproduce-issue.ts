
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
    .eq('products.product_type', 'Lubricant')
    .gt('batches.stock_remaining', 0) // Ensure it has stock
    .limit(1);

  if (itemError || !item || item.length === 0) {
    console.error('Failed to fetch item:', itemError);
    // Debug: list some products
    const { data: prods } = await supabase.from('products').select('name, product_type').limit(5);
    console.log('Available products:', prods);
    return;
  }
  
  const targetItem = item[0];

  const initialBatchStock = targetItem.batches.reduce((sum, b) => sum + b.stock_remaining, 0);
  const initialOpenVolume = targetItem.open_bottle_details.reduce((sum, b) => sum + (Number(b.current_volume) || 0), 0);
  
  console.log(`Initial State for ${targetItem.products.name}:`);
  console.log(`- Batch Stock (Closed Bottles): ${initialBatchStock}`);
  console.log(`- Open Volume: ${initialOpenVolume} L`);

  // 2. Simulate Checkout of 1L from Open Bottle
  const SELL_QUANTITY = 1;

  console.log(`\nSimulating Checkout of ${SELL_QUANTITY}L from Open Bottle...`);
  
  // Determine expectation
  const shouldDeductBatch = initialOpenVolume < SELL_QUANTITY;
  console.log(`Expectation: Batch calc should be ${shouldDeductBatch ? 'REDUCED by 1 (Opened new bottle)' : 'UNCHANGED (Consumed from open)'}`);

  const payload = {
    locationId: targetItem.location_id,
    shopId: targetItem.location_id,
    cashierId: null,
    items: [{
      productId: targetItem.product_id,
      quantity: SELL_QUANTITY, 
      source: 'OPEN',
      volumeDescription: '1L' 
    }],
    totalAmount: 0,
    paymentMethod: 'CASH',
    type: 'SALE'
  };

  // Call the function directly via RPC
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
      batches (
        id, stock_remaining
      )
    `)
    .eq('id', targetItem.id)
    .single();

  const newBatchStock = newItem.batches.reduce((sum, b) => sum + b.stock_remaining, 0);
  
  console.log(`\nPost-Checkout State:`);
  console.log(`- Batch Stock (Closed Bottles): ${newBatchStock}`);
  
  const batchDiff = initialBatchStock - newBatchStock;
  
  if (shouldDeductBatch) {
      if (batchDiff === 1) {
          console.log(`✅ SUCCESS: Batch stock reduced by 1 as expected (Overflow).`);
      } else {
          console.error(`❌ FAILURE: Expected batch deduction of 1, got ${batchDiff}.`);
      }
  } else {
      if (batchDiff === 0) {
          console.log(`✅ SUCCESS: Batch stock UNCHANGED as expected (Consumed open volume).`);
      } else {
          console.error(`❌ FAILURE: BUG DETECTED! Batch stock reduced by ${batchDiff} despite sufficient open volume!`);
      }
  }
}

reproduceBug();
