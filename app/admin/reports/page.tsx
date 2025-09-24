import { RevenueReports } from "@/components/revenue-reports"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Revenue Reports 📊</h1>
            <p className="text-muted-foreground mt-2">Comprehensive analytics for your billiard and gaming shop</p>
          </div>

          <RevenueReports />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
