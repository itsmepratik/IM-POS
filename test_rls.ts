import { createAdminClient } from "./supabase/admin";

async function main() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("get_policies_for_table", {
    table_name: "batches",
  });
  if (error) {
    const { data: policies } = await adminClient
      .from("pg_policies")
      .select("*")
      .eq("tablename", "batches");
    console.log(policies);
    return;
  }
  console.log(data);
}

main().catch(console.error);
