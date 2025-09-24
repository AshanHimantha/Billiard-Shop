import { CashierCreditsView } from "@/components/cashier-credits-view"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function CashierCreditsPage() {
  return (
    <ProtectedRoute requiredRole="cashier">
      <DashboardLayout userRole="cashier">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Customer Credits 💳</h1>
            <p className="text-muted-foreground mt-2">Quick access to customer balances</p>
          </div>

          <CashierCreditsView />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
