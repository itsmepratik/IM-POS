import { Layout } from "@/components/layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    </Layout>
  )
}

