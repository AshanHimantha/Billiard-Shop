import { type NextRequest, NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const stations = await googleSheetsService.getStations()
    return NextResponse.json(stations)
  } catch (error) {
    console.error("Error fetching stations:", error)
    return NextResponse.json({ error: "Failed to fetch stations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, hourlyRate } = body

    if (!name || !type || !hourlyRate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const station = await googleSheetsService.addStation({
      name,
      type,
      status: "available",
      hourlyRate: Number(hourlyRate),
    })

    return NextResponse.json(station)
  } catch (error) {
    console.error("Error adding station:", error)
    return NextResponse.json({ error: "Failed to add station" }, { status: 500 })
  }
}
