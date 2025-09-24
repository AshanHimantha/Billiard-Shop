import { type NextRequest, NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`[v0] Ending session ${params.id}`)

    const body = await request.json()
    console.log(`[v0] Request body:`, body)

    const { suggestedAmount, paidAmount, paymentType, customerName } = body

    if (suggestedAmount === undefined || paidAmount === undefined || !paymentType) {
      console.error(`[v0] Missing required fields:`, { suggestedAmount, paidAmount, paymentType })
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { suggestedAmount, paidAmount, paymentType },
        },
        { status: 400 },
      )
    }

    console.log(`[v0] Calling googleSheetsService.endSession with:`, {
      sessionId: params.id,
      endTime: new Date().toISOString(),
      suggestedAmount: Number(suggestedAmount),
      paidAmount: Number(paidAmount),
      paymentType,
      customerName,
    })

    await googleSheetsService.endSession(params.id, {
      endTime: new Date().toISOString(),
      suggestedAmount: Number(suggestedAmount),
      paidAmount: Number(paidAmount),
      paymentType,
      customerName,
    })

    console.log(`[v0] Session ${params.id} ended successfully`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending session:", error)
    return NextResponse.json(
      {
        error: "Failed to end session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
