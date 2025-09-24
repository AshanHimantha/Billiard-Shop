"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Station {
  id: string
  name: string
  type: "billiard" | "ps4"
  status: "available" | "occupied"
  hourlyRate: number
}

interface Session {
  id: string
  stationId: string
  stationName: string
  startTime: Date
  customerName?: string
  hourlyRate: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SessionManager() {
  const { data: stations = [], mutate: mutateStations } = useSWR<Station[]>("/api/stations", fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds (stations change less frequently)
    revalidateOnFocus: false, // Don't refetch when window gets focus
    revalidateOnReconnect: true, // Only refetch on network reconnect
  })

  const { data: sessionsData = [], mutate: mutateSessions } = useSWR(
    "/api/sessions",
    (url) =>
      fetch(url)
        .then((res) => res.json())
        .then((data) =>
          data.map((session: any) => ({
            ...session,
            id: session.sessionId || session.id,
            stationId: session.itemId || session.stationId,
            stationName: session.itemName || session.stationName,
            startTime: new Date(session.startTime),
            hourlyRate: session.hourlyRate || 0,
          })),
        ),
    {
      refreshInterval: 30000, // Refresh every 30 seconds (reduced from 10s)
      revalidateOnFocus: false, // Don't refetch when window gets focus
      revalidateOnReconnect: true, // Only refetch on network reconnect
    },
  )

  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<string>("")
  const [customerName, setCustomerName] = useState("")

  const availableStations = stations.filter((station) => station.status === "available")

  const startSession = async () => {
    const station = stations.find((s) => s.id === selectedStation)
    if (!station) return

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: station.id,
          stationName: station.name,
          customerName: customerName || undefined,
          hourlyRate: station.hourlyRate,
        }),
      })

      if (response.ok) {
        const newSession = await response.json()
        mutateSessions([...sessionsData, { ...newSession, startTime: new Date(newSession.startTime) }], false)
        mutateStations() // Refresh stations to update status
        setSelectedStation("")
        setCustomerName("")
        setIsStartDialogOpen(false)
      }
    } catch (error) {
      console.error("Error starting session:", error)
    }
  }

  const getTypeIcon = (type: "billiard" | "ps4") => {
    return type === "billiard" ? "🎱" : "🎮"
  }

  const formatDuration = (startTime: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - startTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    return `${hours}h ${minutes}m`
  }

  const calculateSuggestedCost = (startTime: Date, hourlyRate: number) => {
    const now = new Date()
    const diffMs = now.getTime() - startTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60)) // Only charge for complete hours
    return diffHours * hourlyRate
  }

  return (
    <div className="space-y-6">
      {/* Quick Start Section */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-3xl shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">Available Stations</CardTitle>
          <CardDescription className="text-base">Click to start a new session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableStations.map((station) => (
              <Button
                key={station.id}
                onClick={() => {
                  setSelectedStation(station.id)
                  setIsStartDialogOpen(true)
                }}
                className="h-24 text-lg font-medium bg-card hover:bg-accent text-card-foreground border-2 border-border hover:border-primary/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                variant="outline"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getTypeIcon(station.type)}</div>
                  <div className="font-bold text-lg">{station.name}</div>
                  <div className="text-base text-primary font-semibold">Rs. {station.hourlyRate}/hour</div>
                </div>
              </Button>
            ))}
          </div>

          {stations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-lg">No stations configured yet</p>
              <p className="text-sm">Add stations from the admin panel</p>
            </div>
          )}

          {availableStations.length === 0 && stations.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">😴</div>
              <p className="text-lg">All stations are currently occupied</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {sessionsData.length > 0 && (
        <Card className="rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Active Sessions</CardTitle>
            <CardDescription>Currently running sessions - Click to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessionsData.map((session: Session) => (
                <ActiveSessionCard
                  key={session.id}
                  session={session}
                  onSessionEnd={() => {
                    mutateSessions()
                    mutateStations()
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Session Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">🚀 Start New Session</DialogTitle>
            <DialogDescription>
              {selectedStation && <>Starting session for {stations.find((s) => s.id === selectedStation)?.name}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer" className="text-base font-medium">
                Customer Name (Optional)
              </Label>
              <Input
                id="customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="rounded-xl h-14 text-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsStartDialogOpen(false)}
                variant="outline"
                className="flex-1 h-14 rounded-xl text-lg"
              >
                Cancel
              </Button>
              <Button onClick={startSession} className="flex-1 h-14 rounded-xl text-lg font-medium">
                🎯 Start Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ActiveSessionCard({ session, onSessionEnd }: { session: Session; onSessionEnd: () => void }) {
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const [paymentType, setPaymentType] = useState<"full" | "partial" | "credit">("full")
  const [paidAmount, setPaidAmount] = useState("")
  const [customerName, setCustomerName] = useState(session.customerName || "")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute for real-time price calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const handleEndSession = async () => {
    const suggestedCost = calculateSuggestedCost(session.startTime, session.hourlyRate)
    const enteredAmount = Number(paidAmount) || 0
    
    // Validation for cash payment
    if (paymentType === "full") {
      if (!paidAmount || enteredAmount <= 0) {
        alert("Please enter the charge amount for cash payment")
        return
      }
    }
    
    // For full payment, use the entered amount as both suggested and paid
    // For partial payment, use calculated suggested cost but entered paid amount  
    // For credit, use calculated suggested cost but 0 paid amount
    let finalSuggestedAmount: number
    let finalPaidAmount: number
    
    if (paymentType === "full") {
      finalSuggestedAmount = enteredAmount // Use entered amount as the charge
      finalPaidAmount = enteredAmount // Same amount is paid
    } else if (paymentType === "partial") {
      finalSuggestedAmount = suggestedCost // Use calculated amount
      finalPaidAmount = enteredAmount // Use entered partial payment
    } else { // credit
      finalSuggestedAmount = suggestedCost // Use calculated amount
      finalPaidAmount = 0 // No payment made
    }
    
    const finalCustomerName =
      paymentType === "credit" || paymentType === "partial" ? customerName : session.customerName

    if ((paymentType === "credit" || paymentType === "partial") && !finalCustomerName) {
      alert("Customer name is required for credit/partial payments")
      return
    }

    console.log("[v0] Sending payment data:", {
      suggestedAmount: finalSuggestedAmount,
      paidAmount: finalPaidAmount,
      paymentType: paymentType === "full" ? "cash" : paymentType,
      customerName: finalCustomerName,
    })

    try {
      const response = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestedAmount: finalSuggestedAmount,
          paidAmount: finalPaidAmount,
          paymentType: paymentType === "full" ? "cash" : paymentType,
          customerName: finalCustomerName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error:", errorData)
        alert(`Error ending session: ${errorData.error || "Unknown error"}`)
        return
      }

      const result = await response.json()
      console.log("[v0] Session ended successfully:", result)

      setIsEndDialogOpen(false)
      setPaidAmount("")
      setPaymentType("full")
      onSessionEnd()
    } catch (error) {
      console.error("Error ending session:", error)
      alert("Failed to end session. Please try again.")
    }
  }

  const formatDuration = (startTime: Date) => {
    const now = currentTime
    const diffMs = now.getTime() - startTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    return `${hours}h ${minutes}m`
  }

  const calculateSuggestedCost = (startTime: Date, hourlyRate: number) => {
    const now = currentTime
    const diffMs = now.getTime() - startTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60) // Total hours including fractions
    
    // Calculate proportional cost: (time played in hours) × hourly rate
    return Math.round(diffHours * hourlyRate)
  }

  const getDetailedTimeInfo = (startTime: Date, hourlyRate: number) => {
    const now = currentTime
    const diffMs = now.getTime() - startTime.getTime()
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const totalHours = diffMs / (1000 * 60 * 60)
    
    return {
      hours,
      minutes,
      totalMinutes,
      totalHours,
      costPerMinute: hourlyRate / 60
    }
  }

  const duration = formatDuration(session.startTime)
  const suggestedCost = calculateSuggestedCost(session.startTime, session.hourlyRate)
  const timeInfo = getDetailedTimeInfo(session.startTime, session.hourlyRate)

  const getStationIcon = (stationName: string | undefined) => {
    if (!stationName) return "🎮" // Default icon if stationName is undefined
    return stationName.toLowerCase().includes("billiard") ? "🎱" : "🎮"
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20 rounded-2xl hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-3xl">
                {getStationIcon(session.stationName)}
              </div>
              <div>
                <h3 className="font-bold text-xl">{session.stationName || "Unknown Station"}</h3>
                <p className="text-muted-foreground text-base">
                  {session.customerName && `👤 ${session.customerName} • `}
                  Started {session.startTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="text-lg px-3 py-1 mb-2 bg-primary/10 text-primary border-primary/20">{duration}</Badge>
              <div className="text-3xl font-bold text-secondary-foreground">Rs. {suggestedCost}</div>
              <div className="text-sm text-muted-foreground">
                {timeInfo.totalMinutes} minutes played
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Rs. {session.hourlyRate}/hour (Rs. {Math.round(timeInfo.costPerMinute)}/min)
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button
              onClick={() => setIsEndDialogOpen(true)}
              size="lg"
              className="w-full h-16 text-xl font-bold rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-lg hover:shadow-xl transition-all"
            >
              💰 End Session & Process Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced End Session Dialog */}
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">💳 Process Payment</DialogTitle>
            <DialogDescription className="text-base">
              {session.stationName || "Unknown Station"} • Duration: {duration}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Amount Display */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Session Duration</div>
                <div className="text-2xl font-bold text-secondary-foreground mb-2">{duration}</div>
                <div className="text-sm text-muted-foreground mb-3">
                  {timeInfo.totalMinutes} minutes at Rs. {session.hourlyRate}/hour
                </div>
                <div className="border-t pt-3">
                  <div className="text-sm text-muted-foreground mb-1">Suggested Amount</div>
                  <div className="text-3xl font-bold text-primary">Rs. {suggestedCost}</div>
                </div>
              </div>
            </div>

            {/* Payment Type Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">Payment Method</Label>
              <div className="grid gap-3">
                <Button
                  variant={paymentType === "full" ? "default" : "outline"}
                  onClick={() => {
                    setPaymentType("full")
                    setPaidAmount(suggestedCost.toString())
                    // Focus on the input after a short delay
                    setTimeout(() => {
                      const input = document.getElementById('full-payment') as HTMLInputElement
                      if (input) {
                        input.focus()
                        input.select()
                      }
                    }, 100)
                  }}
                  className="h-16 rounded-xl text-lg justify-start"
                >
                  <span className="text-2xl mr-3">💰</span>
                  <div className="text-left">
                    <div className="font-bold">Cash Payment</div>
                    <div className="text-sm opacity-70">Enter exact charge amount</div>
                  </div>
                </Button>

                <Button
                  variant={paymentType === "partial" ? "default" : "outline"}
                  onClick={() => setPaymentType("partial")}
                  className="h-16 rounded-xl text-lg justify-start"
                >
                  <span className="text-2xl mr-3">💳</span>
                  <div className="text-left">
                    <div className="font-bold">Partial Payment</div>
                    <div className="text-sm opacity-70">Pay some now, rest as credit</div>
                  </div>
                </Button>

                <Button
                  variant={paymentType === "credit" ? "default" : "outline"}
                  onClick={() => {
                    setPaymentType("credit")
                    setPaidAmount("0")
                  }}
                  className="h-16 rounded-xl text-lg justify-start"
                >
                  <span className="text-2xl mr-3">📝</span>
                  <div className="text-left">
                    <div className="font-bold">Full Credit</div>
                    <div className="text-sm opacity-70">Add to customer tab</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Amount Input for Full Payment */}
            {paymentType === "full" && (
              <div>
                <Label htmlFor="full-payment" className="text-base font-medium">
                  💰 Amount to Charge (Required)
                </Label>
                <Input
                  id="full-payment"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Enter amount to charge"
                  className="rounded-xl h-16 text-xl font-bold text-center"
                  autoFocus
                />
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <div className="text-sm text-muted-foreground text-center">
                      <strong>Time Played:</strong> {duration} ({timeInfo.totalMinutes} minutes)
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                      <strong>Suggested:</strong> Rs. {suggestedCost} (Rs. {session.hourlyRate}/hour)
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Enter the exact amount you want to charge the customer
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input for Partial Payment */}
            {paymentType === "partial" && (
              <div>
                <Label htmlFor="paid" className="text-base font-medium">
                  Amount Paid Now
                </Label>
                <Input
                  id="paid"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  className="rounded-xl h-14 text-lg"
                />
                {paidAmount && Number(paidAmount) < suggestedCost && (
                  <div className="mt-2 p-3 bg-accent/10 rounded-xl">
                    <div className="text-sm text-muted-foreground">
                      Credit: Rs. {suggestedCost - (Number(paidAmount) || 0)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customer Name for Credit/Partial */}
            {(paymentType === "credit" || paymentType === "partial") && (
              <div>
                <Label htmlFor="customer-credit" className="text-base font-medium">
                  Customer Name *
                </Label>
                <Input
                  id="customer-credit"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Required for credit payments"
                  className="rounded-xl h-14 text-lg"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setIsEndDialogOpen(false)}
                variant="outline"
                className="flex-1 h-14 rounded-xl text-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEndSession}
                className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-primary to-primary/80"
              >
                ✅ Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
