import { SessionManager } from "@/components/session-manager"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function SessionsPage() {
  return (
    <ProtectedRoute requiredRole="cashier">
      <DashboardLayout userRole="cashier">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Start New Session 🚀</h1>
            <p className="text-muted-foreground mt-2">Quick and easy session management</p>
          </div>

          <SessionManager />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
