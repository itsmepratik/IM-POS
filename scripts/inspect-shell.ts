
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

async function inspectShellOil() {
  console.log('--- Inspecting Lubricants with High Open Bottle Count ---');

  // Finding by high open bottle count
  const { data: items, error: itemError } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      open_bottles_stock,
      closed_bottles_stock,
      products (id, name),
      open_bottle_details (
        id, current_volume, is_empty, opened_at
      )
    `)
    .eq('product_id', '2d6f8779-07e2-4cd0-8d25-6e9670955b97')
    .limit(1);

  if (itemError || !items || items.length === 0) {
      console.error('No item found with > 10 open bottles.');
       const { data: prods } = await supabase.from('products').select('name').limit(20);
       console.log('All available products:', prods.map(p => p.name));
      return;
  }
  
  const targetItem = items[0];
  console.log(`Found item with ${targetItem.open_bottles_stock} open bottles: ${targetItem.products.name}`);
  console.log(`- Open Bottles Stock (Count): ${targetItem.open_bottles_stock}`);
  console.log(`- Closed Bottles Stock: ${targetItem.closed_bottles_stock}`);
  
  if (!targetItem.open_bottle_details) {
      console.log('No open bottle details found.');
      return;
  }

  console.log(`\nOpen Bottle Details (${targetItem.open_bottle_details.length} rows):`);
  
  // Sort by opened_at to see FIFO order
  const sortedDetails = targetItem.open_bottle_details.sort((a, b) => 
      new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
  );
  
  // Show first 5 and last 5
  if (sortedDetails.length > 10) {
      sortedDetails.slice(0, 5).forEach(d => console.log(`  [Oldest] Vol: ${d.current_volume}, Empty: ${d.is_empty}, Date: ${d.opened_at}`));
      console.log('  ...');
      sortedDetails.slice(-5).forEach(d => console.log(`  [Newest] Vol: ${d.current_volume}, Empty: ${d.is_empty}, Date: ${d.opened_at}`));
  } else {
      sortedDetails.forEach(d => console.log(`  Vol: ${d.current_volume}, Empty: ${d.is_empty}, Date: ${d.opened_at}`));
  }
}

inspectShellOil();
