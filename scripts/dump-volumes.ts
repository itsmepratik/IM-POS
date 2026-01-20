
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

async function dumpVolumes() {
  console.log('--- Dumping Product Volumes for Shell ---');

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', '%20W-50%')
    .limit(5);

  if (!products || products.length === 0) {
    console.log('No Shell products found.');
    return;
  }

  for (const product of products) {
    console.log(`\nProduct: ${product.name} (${product.id})`);
    
    // Try to select all columns to see what exists
    const { data: volumes, error } = await supabase
      .from('product_volumes')
      .select('*') 
      .eq('product_id', product.id);

    if (error) {
      console.error('Error fetching volumes:', error.message);
      // Fallback: try selecting specific columns if * fails (unlikely with select *)
      continue;
    }

    console.log('Volumes:', volumes);
  }
}

dumpVolumes();
