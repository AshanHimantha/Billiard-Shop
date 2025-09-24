"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

function DashboardContent() {
  const { user } = useAuth()
  
  if (!user) return null

  return (
    <DashboardLayout userRole={user.role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Welcome to your Dashboard! 🎯</h1>
          <p className="text-muted-foreground mt-2">Manage your billiard and gaming shop with ease</p>
        </div>

        {user.role === "admin" ? <AdminDashboard /> : <CashierDashboard />}
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function AdminDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🎱 Manage Stations</CardTitle>
          <CardDescription>Add, update, and remove billiard boards and PS4 stations</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/stations">
            <Button className="w-full rounded-xl">Manage Stations</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">💰 Revenue Reports</CardTitle>
          <CardDescription>View daily, weekly, and monthly revenue analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/reports">
            <Button variant="secondary" className="w-full rounded-xl">
              View Reports
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">💳 Credits Management</CardTitle>
          <CardDescription>Manage customer credits and outstanding balances</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/credits">
            <Button variant="outline" className="w-full rounded-xl bg-transparent">
              Manage Credits
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function CashierDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">🚀 Start Session</CardTitle>
          <CardDescription className="text-base">Begin a new gaming session for customers</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/cashier/sessions">
            <Button size="lg" className="w-full h-14 text-lg rounded-xl">
              Start New Session
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">💳 Active Sessions</CardTitle>
          <CardDescription className="text-base">View and manage ongoing sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/cashier/active">
            <Button variant="secondary" size="lg" className="w-full h-14 text-lg rounded-xl">
              View Active Sessions
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
