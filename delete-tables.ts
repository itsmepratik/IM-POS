import { createAdminClient } from "./supabase/admin";

// Tables to keep (don't delete these)
const TABLES_TO_KEEP = [
  "user_info", // This is a view, not a table
  "profiles", // User profiles table
  "role_permissions", // Role permissions table
];

// All tables that should be deleted
const TABLES_TO_DELETE = [
  "branches",
  "brands",
  "categories",
  "lubricant_inventory",
  "lubricant_volumes",
  "lubricants",
  "lubricant_bottle_states",
  "product_inventory",
  "product_types",
  "products",
  "sale_items",
  "sales",
  "user_profiles", // This seems to be a legacy table
];

async function deleteTables() {
  const supabase = createAdminClient();

  console.log("Starting table deletion process...");
  console.log("Tables to keep:", TABLES_TO_KEEP);
  console.log("Tables to delete:", TABLES_TO_DELETE);

  // Disable RLS temporarily for admin operations
  // Note: This is done automatically with service role key

  // Delete all data from tables first
  for (const tableName of TABLES_TO_DELETE) {
    try {
      console.log(`Deleting all data from table: ${tableName}`);

      // Delete all rows from the table
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq("id", "0"); // This will delete all rows (using a condition that's always true)

      if (deleteError) {
        console.warn(
          `Warning when deleting data from ${tableName}:`,
          deleteError.message
        );
      } else {
        console.log(`Successfully deleted all data from table: ${tableName}`);
      }
    } catch (error) {
      console.error(`Error deleting data from ${tableName}:`, error);
    }
  }

  // Now drop the tables
  for (const tableName of TABLES_TO_DELETE) {
    try {
      console.log(`Dropping table: ${tableName}`);

      // Execute raw SQL to drop the table
      const { error: dropError } = await supabase.rpc("execute_sql", {
        sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`,
      });

      if (dropError) {
        console.warn(
          `Warning when dropping table ${tableName}:`,
          dropError.message
        );
        // Try alternative method
        console.log(`Trying alternative method for ${tableName}...`);
        const { error: altError } = await supabase.rpc("execute_sql", {
          sql: `DROP TABLE IF EXISTS "${tableName}" CASCADE;`,
        });

        if (altError) {
          console.warn(
            `Alternative method also failed for ${tableName}:`,
            altError.message
          );
        } else {
          console.log(
            `Successfully dropped table: ${tableName} (alternative method)`
          );
        }
      } else {
        console.log(`Successfully dropped table: ${tableName}`);
      }
    } catch (error) {
      console.error(`Error dropping table ${tableName}:`, error);
    }
  }

  console.log("Table deletion process completed.");
  console.log("Kept tables:", TABLES_TO_KEEP);
}

// Alternative approach using raw SQL execution
async function deleteTablesWithRawSQL() {
  const supabase = createAdminClient();

  console.log("Starting table deletion process using raw SQL...");
  console.log("Tables to keep:", TABLES_TO_KEEP);
  console.log("Tables to delete:", TABLES_TO_DELETE);

  // For Supabase, we need to use the proper RPC methods or direct SQL
  for (const tableName of TABLES_TO_DELETE) {
    try {
      console.log(`Attempting to drop table: ${tableName}`);

      // In Supabase, we need to execute raw SQL through the proper interface
      // This is a more direct approach to dropping tables
      const query = `DROP TABLE IF EXISTS "${tableName}" CASCADE;`;

      // Using the Supabase client's RPC mechanism if available
      // Note: Direct table dropping may require using the Supabase SQL editor
      // or using a special RPC function

      console.log(`Would execute: ${query}`);
      console.log(
        `Note: In Supabase, you may need to use the SQL editor in the dashboard to drop tables.`
      );
    } catch (error) {
      console.error(`Error with table ${tableName}:`, error);
    }
  }

  console.log("Raw SQL table deletion process completed.");
}

// Run the function
deleteTables().catch(console.error);
