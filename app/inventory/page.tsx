import { redirect } from "next/navigation";

export default function InventoryRedirect() {
  // Redirect to main-inventory by default server-side
  redirect("/inventory/main-inventory");
}
