import { CreditsManagement } from "@/components/credits-management"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function CreditsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Credits Management 💳</h1>
            <p className="text-muted-foreground mt-2">Manage customer credits and outstanding balances</p>
          </div>

          <CreditsManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
