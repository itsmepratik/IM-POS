import { createAdminClient } from "./supabase/admin";

async function main() {
  const adminClient = createAdminClient();
  const { data: batches } = await adminClient
    .from("batches")
    .select("id")
    .limit(1);
  console.log("Admin fetch batches:", batches ? batches.length : 0);

  // Check pg_class to see if RLS is enabled on batches table
  const { data: classData, error: classError } = await adminClient
    .from("pg_class")
    .select("relrowsecurity")
    .eq("relname", "batches");

  if (classError) {
    console.log("Error checking pg_class:", classError.message);
  } else {
    console.log("RLS Enabled on batches:", classData?.[0]?.relrowsecurity);
  }
}

main().catch(console.error);
