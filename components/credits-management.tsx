"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Credit {
  creditId: string
  customerName: string
  amount: number
  status: "paid" | "unpaid"
  createdAt: string
  sessionId?: string // Link to the originating session
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function CreditsManagement() {
  const {
    data: credits = [],
    error,
    mutate,
  } = useSWR<Credit[]>("/api/credits", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCredit, setNewCredit] = useState({
    customerName: "",
    amount: 0,
  })

  const handleAddCredit = async () => {
    if (!newCredit.customerName || newCredit.amount <= 0) return

    try {
      const response = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCredit),
      })

      if (response.ok) {
        const newCreditData = await response.json()
        mutate([newCreditData, ...credits], false) // Optimistic update
        setNewCredit({ customerName: "", amount: 0 })
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding credit:", error)
    }
  }

  const markAsPaid = async (creditId: string) => {
    try {
      const response = await fetch(`/api/credits/${creditId}/pay`, {
        method: "POST",
      })

      if (response.ok) {
        console.log(`[v0] Successfully marked credit ${creditId} as paid`)
        // Refresh the data from the server to get updated status
        mutate()
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error:", errorData)
        alert(`Error marking credit as paid: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error marking credit as paid:", error)
      alert("Failed to mark credit as paid. Please try again.")
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const unpaidCredits = credits.filter((credit) => credit.status === "unpaid")
  const paidCredits = credits.filter((credit) => credit.status === "paid")
  const totalOutstanding = unpaidCredits.reduce((sum, credit) => sum + credit.amount, 0)

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
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Credits</CardDescription>
            <CardTitle className="text-3xl font-bold text-accent-foreground">{unpaidCredits.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Outstanding</CardDescription>
            <CardTitle className="text-3xl font-bold text-secondary-foreground">Rs. {totalOutstanding}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Paid This Month</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">{paidCredits.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Add Credit Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Customer Credits</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg">Add Manual Credit</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Manual Credit</DialogTitle>
              <DialogDescription>Create a credit balance for a customer</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={newCredit.customerName}
                  onChange={(e) => setNewCredit({ ...newCredit, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="amount">Credit Amount (Rs.)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newCredit.amount || ""}
                  onChange={(e) => setNewCredit({ ...newCredit, amount: Number(e.target.value) })}
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleAddCredit} className="w-full rounded-xl">
                Add Credit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Outstanding Credits */}
      {unpaidCredits.length > 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Outstanding Credits
              <Badge className="bg-accent/20 text-accent-foreground">{unpaidCredits.length}</Badge>
            </CardTitle>
            <CardDescription>Customers with unpaid balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unpaidCredits.map((credit) => (
                <div
                  key={credit.creditId}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/5 to-secondary/5 rounded-2xl border border-accent/10 hover:border-accent/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20">
                      <AvatarFallback className="text-sm font-semibold text-primary">
                        {getInitials(credit.customerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{credit.customerName}</h3>
                      <p className="text-sm text-muted-foreground">Created {formatDate(credit.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-accent-foreground">Rs. {credit.amount}</div>
                      <div className="text-sm text-muted-foreground">Outstanding</div>
                    </div>
                    <Button
                      onClick={() => markAsPaid(credit.creditId)}
                      className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Mark as Paid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paid Credits History */}
      {paidCredits.length > 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ Paid Credits
              <Badge className="bg-primary/20 text-primary-foreground">{paidCredits.length}</Badge>
            </CardTitle>
            <CardDescription>Recently paid customer balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidCredits.slice(0, 5).map((credit) => (
                <div
                  key={credit.creditId}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/10 opacity-75"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/30">
                      <AvatarFallback className="text-sm font-semibold text-primary">
                        {getInitials(credit.customerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{credit.customerName}</h3>
                      <p className="text-sm text-muted-foreground">Paid on {formatDate(credit.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">Rs. {credit.amount}</div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {credits.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">No Credits Yet</h3>
            <p className="text-muted-foreground mb-4">Customer credits will appear here when created</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl">
              Add First Credit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
