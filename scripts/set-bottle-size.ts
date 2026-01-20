
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setBottleSize() {
  console.log('--- Setting Bottle Size to 4.0 for 20W-50 ---');

  const { data, error } = await supabase
    .from('products')
    .update({ bottle_size: 4.0 })
    .ilike('name', '%20W-50%')
    .select();

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log(`Updated ${data.length} products to bottle_size = 4.0`);
    data.forEach(p => console.log(`- ${p.name}: ${p.bottle_size}`));
  }
}

setBottleSize();
