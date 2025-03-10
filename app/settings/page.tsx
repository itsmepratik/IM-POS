import { Layout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function SettingsPage() {
  return (
    <Layout>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Clock className="w-16 h-16 text-muted-foreground" />
          <p className="text-center text-muted-foreground">
            We're working hard to bring you the best settings experience. This page will be available soon. Thank you
            for your patience!
          </p>
        </CardContent>
      </Card>
    </Layout>
  )
}

