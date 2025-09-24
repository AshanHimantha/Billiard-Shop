import { StationManagement } from "@/components/station-management"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function StationsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Station Management 🎱</h1>
            <p className="text-muted-foreground mt-2">Manage your billiard boards and PS4 stations</p>
          </div>

          <StationManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
