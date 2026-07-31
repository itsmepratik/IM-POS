import { Layout } from "@/components/layout"
import ReportsClient from "./reports-client"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reports | HNS Automotive",
  description: "View sales reports and analytics",
}

export default function ReportsPage() {
  return (
    <Layout>
      <ReportsClient />
    </Layout>
  )
}

