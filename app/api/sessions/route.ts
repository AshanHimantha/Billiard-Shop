import { type NextRequest, NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    // Get both sessions and stations data
    const [sessions, stations] = await Promise.all([
      googleSheetsService.getActiveSessions(),
      googleSheetsService.getStations()
    ])

    // Enrich session data with station information (hourly rate, type)
    const enrichedSessions = sessions.map(session => {
      const station = stations.find(s => s.id === session.itemId)
      return {
        id: session.sessionId,
        stationId: session.itemId,
        stationName: session.itemName,
        startTime: session.startTime,
        customerName: session.customerName,
        hourlyRate: station?.hourlyRate || 0,
        type: station?.type || 'billiard'
      }
    })

    console.log("[v0] Enriched sessions with station data:", enrichedSessions)
    return NextResponse.json(enrichedSessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stationId, stationName, customerName, hourlyRate } = body

    if (!stationId || !stationName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const session = await googleSheetsService.startSession({
      itemId: stationId,
      itemName: stationName,
      customerName,
      suggestedAmount: 0,
      paidAmount: 0,
      balance: 0,
      paymentType: "cash",
    })

    return NextResponse.json({
      id: session.sessionId,
      stationId: session.itemId,
      stationName: session.itemName,
      startTime: session.startTime,
      customerName: session.customerName,
      hourlyRate: hourlyRate || 0,
    })
  } catch (error) {
    console.error("Error starting session:", error)
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 })
  }
}
