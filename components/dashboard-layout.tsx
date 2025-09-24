"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "admin" | "cashier"
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                  <span className="text-xl">🎱</span>
                </div>
              </Link>
              <div>
                <h1 className="font-bold text-lg">Billiard Shop</h1>
                <p className="text-sm text-muted-foreground capitalize">{userRole} Dashboard</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4">
              {userRole === "admin" ? (
                <>
                  <Link href="/admin/stations">
                    <Button variant="ghost" className="rounded-xl">
                      Stations
                    </Button>
                  </Link>
                  <Link href="/admin/reports">
                    <Button variant="ghost" className="rounded-xl">
                      Reports
                    </Button>
                  </Link>
                  <Link href="/admin/credits">
                    <Button variant="ghost" className="rounded-xl">
                      Credits
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/cashier/sessions">
                    <Button variant="ghost" className="rounded-xl">
                      Sessions
                    </Button>
                  </Link>
                  <Link href="/cashier/active">
                    <Button variant="ghost" className="rounded-xl">
                      Active
                    </Button>
                  </Link>
                  <Link href="/cashier/credits">
                    <Button variant="ghost" className="rounded-xl">
                      Credits
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            <Button variant="outline" onClick={handleLogout} className="rounded-xl bg-transparent">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
