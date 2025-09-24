import { type NextRequest, NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await googleSheetsService.updateStation(params.id, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating station:", error)
    return NextResponse.json({ error: "Failed to update station" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await googleSheetsService.deleteStation(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting station:", error)
    return NextResponse.json({ error: "Failed to delete station" }, { status: 500 })
  }
}
