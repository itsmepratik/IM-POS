
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('--- Debugging Volume Deduction Logic ---');

  // 1. Find the target item (Shell 20W-50)
  const { data: items, error: itemError } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      open_bottles_stock,
      products (name, product_type, category_id),
      open_bottle_details (
        id, current_volume, is_empty
      )
    `)
    .gt('open_bottles_stock', 10) 
    .limit(1);

  if (itemError || !items || items.length === 0) {
      console.error('Target item not found');
      return;
  }
  
  const item = items[0];
  console.log(`Product: ${item.products.name}`);
  console.log(`Type: ${item.products.product_type}`);
  
  const totalVolStart = item.open_bottle_details.reduce((sum, d) => sum + Number(d.current_volume), 0);
  console.log(`Initial Total Volume: ${totalVolStart} L (across ${item.open_bottle_details.length} bottles)`);

  // 2. Perform 5 sequential checkouts of 1L
  for (let i = 1; i <= 5; i++) {
      console.log(`\nTransaction #${i}: Selling 1L...`);
      
      const payload = {
        items: [{
          productId: item.product_id,
          quantity: 1, 
          source: 'OPEN',
          volumeDescription: '1L' 
        }]
      };

      // Fetch dependencies
      const { data: activeItem } = await supabase.from('inventory').select('location_id').eq('id', item.id).single();
      const { data: shop } = await supabase.from('shops').select('id').limit(1).single();
      const shopId = shop?.id || activeItem.location_id; 

      const { error: rpcError } = await supabase.rpc('create_checkout_transaction', {
        p_location_id: activeItem.location_id,
        p_shop_id: shopId,
        p_cashier_id: null,
        p_items: payload.items,
        p_total_amount: 0,
        p_payment_method: 'CASH',
        p_type: 'SALE'
      });
      
      if (rpcError) {
          console.error(`Transaction #${i} FAILED:`, rpcError);
          break;
      }
      
      // Check Volume
      const { data: verifyItem } = await supabase
        .from('inventory')
        .select(`
            open_bottles_stock,
            open_bottle_details (current_volume)
        `)
        .eq('id', item.id)
        .single();
        
      const currentTotalVol = verifyItem.open_bottle_details.reduce((sum, d) => sum + Number(d.current_volume), 0);
      const expectedVol = totalVolStart - i;
      
      console.log(`  Current Volume: ${currentTotalVol} L`);
      console.log(`  Open Count: ${verifyItem.open_bottles_stock}`);
      
      if (Math.abs(currentTotalVol - expectedVol) < 0.01) {
          console.log('  ✅ Deduction Correct');
      } else {
          console.error(`  ❌ Deduction MISMATCH! Expected ${expectedVol}, got ${currentTotalVol}`);
      }
  }
}

runTest();
