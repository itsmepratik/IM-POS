import type { Metadata } from "next";
import { Layout } from "@/components/layout";
import { RouteProtection } from "@/components/route-protection";
import { BackupClient } from "./backup-client";

export const metadata: Metadata = {
  title: "System Backup | IM-POS Admin",
  description:
    "Full-system database backup: download JSON, SQL, or CSV archive, and restore from a verified backup file.",
};

export default function AdminBackupPage(): React.JSX.Element {
  return (
    <RouteProtection adminOnly={true} fallbackPath="/pos">
      <Layout>
        <BackupClient />
      </Layout>
    </RouteProtection>
  );
}
