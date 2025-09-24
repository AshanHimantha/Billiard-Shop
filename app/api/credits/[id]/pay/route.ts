import { type NextRequest, NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await googleSheetsService.markCreditAsPaid(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking credit as paid:", error)
    return NextResponse.json({ error: "Failed to mark credit as paid" }, { status: 500 })
  }
}
