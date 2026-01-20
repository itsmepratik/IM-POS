
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

async function inspectBottleSize() {
  console.log('--- Inspecting bottle_size column for Shell products ---');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, bottle_size, product_type')
    .ilike('name', '%20W-50%')
    .limit(5);

  if (error) {
     console.error('Error fetching products:', error);
     return;
  }

  if (!products || products.length === 0) {
    console.log('No 20W-50 products found.');
    return;
  }

  products.forEach(p => {
      console.log(`Product: ${p.name}`);
      console.log(`  - Bottle Size: ${p.bottle_size} L`);
      console.log(`  - Type: ${p.product_type}`);
  });
}

inspectBottleSize();
