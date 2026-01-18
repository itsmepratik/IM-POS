
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const migrationFile = '20260119000000_fix_open_bottle_checkout_final.sql';
  const migrationPath = path.resolve(__dirname, `../supabase/migrations/${migrationFile}`);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
      console.error('Missing DATABASE_URL');
      process.exit(1);
  }

  const sql = postgres(connectionString);

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Applying migration: ${migrationFile}`);
  try {
    await sql.unsafe(migrationSql);
    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
