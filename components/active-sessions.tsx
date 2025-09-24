"use client"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Session {
  id: string
  stationName: string
  customerName?: string
  startTime: Date
  hourlyRate: number
  type: "billiard" | "ps4"
}

interface Station {
  id: string
  name: string
  type: "billiard" | "ps4"
  status: "available" | "occupied" | "maintenance"
  hourlyRate: number
}

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) =>
      data.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
      })),
    )

const stationFetcher = (url: string) => fetch(url).then((res) => res.json())

export function ActiveSessions() {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const {
    data: sessions = [],
    error,
    mutate,
  } = useSWR<Session[]>("/api/sessions", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds (reduced for better performance)
    revalidateOnFocus: false, // Don't refetch when window gets focus
    revalidateOnReconnect: true, // Only refetch on network reconnect
  })

  const {
    data: stations = [],
    error: stationsError,
  } = useSWR<Station[]>("/api/stations", stationFetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds (stations change less frequently)
    revalidateOnFocus: false, // Don't refetch when window gets focus
    revalidateOnReconnect: true, // Only refetch on network reconnect
  })

  // Update current time every minute for real-time price calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const availableStations = stations.filter((station) => station.status === "available")

  const endSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
      })

      if (response.ok) {
        mutate() // Refresh the data
      }
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  const formatDuration = (startTime: Date) => {
    if (!startTime || !(startTime instanceof Date)) {
      return "0h 0m"
    }
    const now = new Date()
    const diffMs = now.getTime() - startTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    return `${hours}h ${minutes}m`
  }

  const calculateCurrentCost = (startTime: Date, hourlyRate: number) => {
    if (!startTime || !(startTime instanceof Date)) {
      return 0
    }
    const now = currentTime
    const diffMs = now.getTime() - startTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60) // Total hours including fractions
    
    // Calculate proportional cost: (time played in hours) × hourly rate
    return Math.round(diffHours * hourlyRate)
  }

  const getDetailedTimeInfo = (startTime: Date, hourlyRate: number) => {
    if (!startTime || !(startTime instanceof Date)) {
      return { totalMinutes: 0, costPerMinute: 0 }
    }
    const now = currentTime
    const diffMs = now.getTime() - startTime.getTime()
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    
    return {
      totalMinutes,
      costPerMinute: hourlyRate / 60
    }
  }

  const getTypeIcon = (type: "billiard" | "ps4") => {
    return type === "billiard" ? "🎱" : "🎮"
  }

  const getDurationColor = (startTime: Date) => {
    if (!startTime || !(startTime instanceof Date)) {
      return "bg-green-100 text-green-800 border-green-200"
    }
    const diffMs = Date.now() - startTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 30) return "bg-green-100 text-green-800 border-green-200"
    if (diffMins < 90) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-orange-100 text-orange-800 border-orange-200"
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Error Loading Sessions</h3>
        <p className="text-muted-foreground">Please check your Google Sheets connection</p>
      </div>
    )
  }

  if (!sessions) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-green-100/50 to-green-50/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>Available Stations</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">{availableStations.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue (Pending)</CardDescription>
            <CardTitle className="text-3xl font-bold text-secondary-foreground">
              Rs.{" "}
              {sessions.reduce((sum, session) => sum + calculateCurrentCost(session.startTime, session.hourlyRate), 0)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardDescription>Longest Session</CardDescription>
            <CardTitle className="text-3xl font-bold text-accent-foreground">
              {sessions.length > 0
                ? formatDuration(
                    sessions.reduce(
                      (earliest, session) => (session.startTime < earliest ? session.startTime : earliest),
                      sessions[0].startTime,
                    ),
                  )
                : "0h 0m"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick action for available stations */}
      {availableStations.length > 0 && sessions.length === 0 && (
        <Card className="rounded-2xl bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Ready to Start Sessions!</h3>
              <p className="text-muted-foreground mb-4">
                {availableStations.length} station{availableStations.length > 1 ? 's' : ''} available
              </p>
              <a href="/cashier/sessions">
                <Button size="lg" className="rounded-xl text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all">
                  🎯 Start New Session
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sessions.map((session) => {
          const currentCost = calculateCurrentCost(session.startTime, session.hourlyRate)
          const timeInfo = getDetailedTimeInfo(session.startTime, session.hourlyRate)
          
          return (
            <Card key={session.id} className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl">
                      {getTypeIcon(session.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{session.stationName}</h3>
                      <p className="text-muted-foreground text-base">
                        {session.customerName ? `👤 ${session.customerName} • ` : ""}
                        Started at {session.startTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <Badge className={`rounded-full text-base px-4 py-2 ${getDurationColor(session.startTime)}`}>
                      ⏱️ {formatDuration(session.startTime)}
                    </Badge>
                    <div className="text-3xl font-bold text-primary">
                      Rs. {currentCost}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {timeInfo.totalMinutes} minutes played
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rs. {session.hourlyRate}/hour (Rs. {Math.round(timeInfo.costPerMinute)}/min)
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" className="flex-1 h-14 rounded-xl text-lg bg-transparent">
                    ⏰ Add Time
                  </Button>
                  <Button
                    onClick={() => endSession(session.id)}
                    className="flex-1 h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70"
                  >
                    💰 End & Pay (Rs. {currentCost})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sessions.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <h3 className="text-xl font-semibold mb-2">No Active Sessions</h3>
            <p className="text-muted-foreground mb-6">All stations are currently available</p>
            <a href="/cashier/sessions">
              <Button size="lg" className="rounded-xl text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all">
                🚀 Start New Session
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
