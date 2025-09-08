import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/supabase/admin";

const BodySchema = z.object({
  lubricant_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  open_bottles: z.number().int().min(0),
  closed_bottles: z.number().int().min(0),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    const supabase = createAdminClient();

    console.log("🛢️ API: Updating bottle states:", body);

    // Update the lubricant_inventory table directly - triggers will sync bottle_states automatically
    const { error: inventoryError } = await supabase
      .from("lubricant_inventory")
      .update({
        bottles_open: body.open_bottles,
        bottles_closed: body.closed_bottles,
        updated_at: new Date().toISOString(),
      })
      .eq("lubricant_id", body.lubricant_id)
      .eq("branch_id", body.branch_id);

    if (inventoryError) {
      console.error("❌ Error updating inventory:", inventoryError);
      return NextResponse.json(
        { error: inventoryError.message },
        { status: 500 }
      );
    }

    console.log(
      "✅ Successfully updated inventory - triggers will sync bottle states"
    );
    return NextResponse.json({
      ok: true,
      message: "Inventory updated successfully",
      updated: {
        lubricant_id: body.lubricant_id,
        branch_id: body.branch_id,
        open_bottles: body.open_bottles,
        closed_bottles: body.closed_bottles,
      },
    });
  } catch (e: any) {
    console.error("❌ API Error:", e);
    const msg = e?.message || "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
