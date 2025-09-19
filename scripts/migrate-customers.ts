import { queryClient } from "@/lib/db/client";

async function migrateCustomers() {
  try {
    console.log("Creating customers table...");
    
    await queryClient`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log("Creating indexes...");
    
    await queryClient`
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    `;
    
    await queryClient`
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    `;
    
    await queryClient`
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    `;

    console.log("Creating update trigger...");
    
    await queryClient`
      CREATE OR REPLACE FUNCTION update_customers_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await queryClient`
      DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
    `;

    await queryClient`
      CREATE TRIGGER trigger_customers_updated_at
        BEFORE UPDATE ON customers
        FOR EACH ROW
        EXECUTE FUNCTION update_customers_updated_at();
    `;

    console.log("✅ Customers table migration completed successfully!");
    
    // Test the table
    const result = await queryClient`SELECT COUNT(*) as count FROM customers`;
    console.log(`Customers table has ${result[0].count} records`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await queryClient.end();
  }
}

// Run migration
migrateCustomers().catch(console.error);