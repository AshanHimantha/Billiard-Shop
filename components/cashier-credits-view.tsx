"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Credit {
  creditId: string
  customerName: string
  amount: number
  status: "paid" | "unpaid"
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function CashierCreditsView() {
  const {
    data: credits = [],
    error,
    mutate,
  } = useSWR<Credit[]>("/api/credits", fetcher, {
    refreshInterval: 15000, // Refresh every 15 seconds
  })

  const [searchTerm, setSearchTerm] = useState("")

  const markAsPaid = async (creditId: string) => {
    try {
      const response = await fetch(`/api/credits/${creditId}/pay`, {
        method: "POST",
      })

      if (response.ok) {
        mutate(
          credits.map((credit) => (credit.creditId === creditId ? { ...credit, status: "paid" as const } : credit)),
          false,
        )
      }
    } catch (error) {
      console.error("Error marking credit as paid:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredCredits = credits
    .filter((credit) => credit.status === "unpaid")
    .filter((credit) => credit.customerName.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalOutstanding = filteredCredits.reduce((sum, credit) => sum + credit.amount, 0)

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Error Loading Credits</h3>
        <p className="text-muted-foreground">Please check your Google Sheets connection</p>
      </div>
    )
  }

  if (!credits) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Credits</CardDescription>
            <CardTitle className="text-3xl font-bold text-accent-foreground">{filteredCredits.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Outstanding</CardDescription>
            <CardTitle className="text-3xl font-bold text-secondary-foreground">Rs. {totalOutstanding}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">🔍 Search Customer Credits</CardTitle>
          <CardDescription>Find customers with outstanding balances</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl h-14 text-lg"
          />
        </CardContent>
      </Card>

      {/* Credits List */}
      {filteredCredits.length > 0 ? (
        <div className="space-y-4">
          {filteredCredits.map((credit) => (
            <Card
              key={credit.creditId}
              className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-accent/5 to-secondary/5 border-accent/10"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20">
                      <AvatarFallback className="text-xl font-bold text-primary">
                        {getInitials(credit.customerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-2xl">👤 {credit.customerName}</h3>
                      <p className="text-muted-foreground text-base">
                        📅 Credit created {new Date(credit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-4xl font-bold text-accent-foreground">Rs. {credit.amount}</div>
                      <div className="text-sm text-muted-foreground">Outstanding</div>
                    </div>
                    <Button
                      onClick={() => markAsPaid(credit.creditId)}
                      size="lg"
                      className="h-16 px-8 text-xl font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      ✅ Mark as Paid
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No matching customers" : "No outstanding credits"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try a different search term" : "All customers have paid their balances!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
