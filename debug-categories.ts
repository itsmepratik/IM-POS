import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCategories() {
  console.log('🔍 Debugging Categories Data...\n');

  try {
    // Check categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return;
    }

    console.log('📂 Categories in database:');
    categories?.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: ${cat.name}`);
    });
    console.log('');

    // Check products with their categories
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand_id,
        category_id,
        categories!inner(id, name),
        brands(id, name)
      `)
      .limit(10);

    if (productsError) {
      console.error('❌ Error fetching products with categories:', productsError);
      return;
    }

    console.log('🛍️ Sample products with categories:');
    products?.forEach(product => {
      console.log(`  - ${product.name}`);
      console.log(`    Brand: ${product.brands?.name || 'N/A'}`);
      console.log(`    Category ID: ${product.category_id}`);
      console.log(`    Category Name: ${product.categories?.name || 'N/A'}`);
      console.log('');
    });

    // Check inventory items for Sanaiya
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        id,
        selling_price,
        total_stock,
        location_id,
        products!inner(
          id,
          name,
          brand_id,
          category_id,
          categories!inner(id, name),
          brands(id, name)
        )
      `)
      .eq('location_id', 'c8b5f1e4-8a2d-4f3e-9b1c-2d3e4f5a6b7c')
      .limit(5);

    if (inventoryError) {
      console.error('❌ Error fetching inventory with categories:', inventoryError);
      return;
    }

    console.log('📦 Sample Sanaiya inventory with categories:');
    inventory?.forEach(item => {
      console.log(`  - ${item.products.name}`);
      console.log(`    Brand: ${item.products.brands?.name || 'N/A'}`);
      console.log(`    Category: ${item.products.categories?.name || 'N/A'}`);
      console.log(`    Stock: ${item.total_stock}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugCategories();