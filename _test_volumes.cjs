const {Client}=require('pg');
const c=new Client({connectionString:'postgresql://postgres.yswnbtmhjspgchautipr:Prtkdev11111.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'});

(async () => {
  try {
    await c.connect();

    // Get a clean lubricant
    let r = await c.query(`
      SELECT p.id, p.name, p.bottle_size, i.id as inv_id, i.location_id, i.standard_stock, i.closed_bottles_stock, i.open_bottles_stock
      FROM products p
      JOIN inventory i ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.name = 'Lubricants' AND i.open_bottles_stock = 0 AND i.closed_bottles_stock > 10
      LIMIT 1
    `);
    const prod = r.rows[0];
    console.log('TEST PRODUCT:', prod.name, '| bottle_size:', prod.bottle_size);
    console.log('BEFORE:', JSON.stringify({standard: prod.standard_stock, closed: prod.closed_bottles_stock, open: prod.open_bottles_stock}));

    r = await c.query(`SELECT id FROM shops LIMIT 1`);
    const shopId = r.rows[0].id;
    r = await c.query(`SELECT id FROM staff LIMIT 1`);
    const cashierId = r.rows[0].id;

    // TEST 1: 250ml CLOSED (should open 1 bottle, residual = bottle_size - 0.25)
    console.log('\n--- TEST 1: 250ml CLOSED ---');
    const cart1 = JSON.stringify([{
      productId: prod.id, quantity: 1, sellingPrice: 1,
      volumeDescription: '250ml closed bottle', source: 'CLOSED'
    }]);
    r = await c.query(`SELECT create_checkout_transaction(
      $1::uuid, $2::uuid, $3::uuid, $4::jsonb,
      1::numeric, 'CASH'::text, 'SALE'::text,
      NULL::uuid, NULL::numeric, NULL::text, NULL::numeric, NULL::numeric,
      NULL::text, NULL::text, NULL::text, NULL::text, NULL::jsonb, NULL::text, NULL::jsonb
    ) as data`, [prod.location_id, shopId, cashierId, cart1]);
    console.log('Result:', JSON.stringify(r.rows[0].data));

    r = await c.query(`SELECT standard_stock, closed_bottles_stock, open_bottles_stock FROM inventory WHERE id = $1`, [prod.inv_id]);
    console.log('AFTER 250ml:', JSON.stringify(r.rows[0]));
    r = await c.query(`SELECT initial_volume, current_volume, is_empty FROM open_bottle_details WHERE inventory_id = $1 AND is_empty = FALSE ORDER BY opened_at DESC LIMIT 1`, [prod.inv_id]);
    console.log('Latest open bottle:', JSON.stringify(r.rows[0]));

    // TEST 2: 500ml OPEN (should consume from existing open bottle)
    console.log('\n--- TEST 2: 500ml OPEN ---');
    const cart2 = JSON.stringify([{
      productId: prod.id, quantity: 1, sellingPrice: 2,
      volumeDescription: '500ml open bottle', source: 'OPEN'
    }]);
    r = await c.query(`SELECT create_checkout_transaction(
      $1::uuid, $2::uuid, $3::uuid, $4::jsonb,
      2::numeric, 'CASH'::text, 'SALE'::text,
      NULL::uuid, NULL::numeric, NULL::text, NULL::numeric, NULL::numeric,
      NULL::text, NULL::text, NULL::text, NULL::text, NULL::jsonb, NULL::text, NULL::jsonb
    ) as data`, [prod.location_id, shopId, cashierId, cart2]);
    console.log('Result:', JSON.stringify(r.rows[0].data));

    r = await c.query(`SELECT standard_stock, closed_bottles_stock, open_bottles_stock FROM inventory WHERE id = $1`, [prod.inv_id]);
    console.log('AFTER 500ml OPEN:', JSON.stringify(r.rows[0]));
    r = await c.query(`SELECT initial_volume, current_volume, is_empty FROM open_bottle_details WHERE inventory_id = $1 AND is_empty = FALSE ORDER BY opened_at DESC LIMIT 2`, [prod.inv_id]);
    console.log('Open bottles:', JSON.stringify(r.rows));

    // TEST 3: 5L CLOSED (should open 1 full bottle if bottle_size=4, or appropriate number)
    console.log('\n--- TEST 3: 5L CLOSED (bottle_size=' + prod.bottle_size + ') ---');
    const cart3 = JSON.stringify([{
      productId: prod.id, quantity: 1, sellingPrice: 15,
      volumeDescription: '5L closed bottle', source: 'CLOSED'
    }]);
    r = await c.query(`SELECT create_checkout_transaction(
      $1::uuid, $2::uuid, $3::uuid, $4::jsonb,
      15::numeric, 'CASH'::text, 'SALE'::text,
      NULL::uuid, NULL::numeric, NULL::text, NULL::numeric, NULL::numeric,
      NULL::text, NULL::text, NULL::text, NULL::text, NULL::jsonb, NULL::text, NULL::jsonb
    ) as data`, [prod.location_id, shopId, cashierId, cart3]);
    console.log('Result:', JSON.stringify(r.rows[0].data));

    r = await c.query(`SELECT standard_stock, closed_bottles_stock, open_bottles_stock FROM inventory WHERE id = $1`, [prod.inv_id]);
    console.log('AFTER 5L CLOSED:', JSON.stringify(r.rows[0]));
    r = await c.query(`SELECT initial_volume, current_volume, is_empty FROM open_bottle_details WHERE inventory_id = $1 AND is_empty = FALSE ORDER BY opened_at DESC LIMIT 3`, [prod.inv_id]);
    console.log('Open bottles:', JSON.stringify(r.rows));

    // Cleanup: delete test transactions
    const testIds = (await c.query(`SELECT id FROM transactions ORDER BY created_at DESC LIMIT 3`)).rows.map(x => x.id);
    for (const id of testIds) {
      await c.query(`DELETE FROM service_items WHERE transaction_id = $1`, [id]);
      await c.query(`DELETE FROM transactions WHERE id = $1`, [id]);
    }
    // Restore inventory
    await c.query(`UPDATE inventory SET standard_stock = $1, closed_bottles_stock = $2 WHERE id = $3`, [prod.standard_stock, prod.closed_bottles_stock, prod.inv_id]);
    await c.query(`DELETE FROM open_bottle_details WHERE inventory_id = $1`, [prod.inv_id]);
    console.log('\nTest data cleaned up.');

    await c.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    await c.end();
  }
})();
