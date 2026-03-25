import { Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Dashboard landing page with welcome card and Get Started CTA.
 * Matches UI-SPEC.md copywriting contract.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your OpenClaw installation.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            <CardTitle>Welcome to OpenClaw</CardTitle>
          </div>
          <CardDescription>
            Let's get your system ready. Start by checking your environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  )
}
