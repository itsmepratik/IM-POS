import { redirect } from "next/navigation";

// Root page redirects server-side to let middleware handle role-based routing
export default function RootPage() {
  redirect("/dashboard");
}
