import { ActiveSessions } from "@/components/active-sessions"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function ActiveSessionsPage() {
  return (
    <ProtectedRoute requiredRole="cashier">
      <DashboardLayout userRole="cashier">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Active Sessions 💳</h1>
            <p className="text-muted-foreground mt-2">Manage all ongoing sessions</p>
          </div>

          <ActiveSessions />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
