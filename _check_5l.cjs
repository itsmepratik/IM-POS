const {Client}=require('pg');
const c=new Client({connectionString:'postgresql://postgres.yswnbtmhjspgchautipr:Prtkdev11111.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'});

(async () => {
  try {
    await c.connect();

    // Find products that had 5L in the original seed data (before migration)
    // These are products from the CSV that literally have 5L as a quantity
    let r = await c.query(`
      SELECT p.id, p.name, pv.volume_description, pv.selling_price
      FROM product_volumes pv
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.name = 'Lubricants' AND pv.volume_description = '5L'
      ORDER BY p.name
    `);
    console.log('Products currently with 5L (' + r.rows.length + '):');
    r.rows.forEach(row => console.log('  ' + row.name + ' @ ' + row.selling_price));

    await c.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    await c.end();
  }
})();
