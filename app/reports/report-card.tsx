import type React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Share2 } from "lucide-react"

interface ReportCardProps {
  title: string
  icon: React.ReactNode
  content: string
  isLoading: boolean
}

export default function ReportCard({ title, icon, content, isLoading }: ReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{content}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </CardFooter>
    </Card>
  )
}

