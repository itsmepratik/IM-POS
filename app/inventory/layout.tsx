import { Layout } from "@/components/layout";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Mobile: add small top space so search doesn't stick; Desktop: rely on main Layout padding */}
        <div className="flex-1 overflow-auto mt-3 md:mt-0">{children}</div>
      </div>
    </Layout>
  );
}
