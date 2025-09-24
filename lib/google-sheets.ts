// Google Sheets API integration for billiard shop management
// This handles all database operations using Google Sheets as the backend

interface SheetData {
  range: string
  values: any[][]
}

interface Station {
  id: string
  name: string
  status: "available" | "occupied" | "maintenance"
  type: "billiard" | "ps4"
  hourlyRate: number
}

interface Session {
  sessionId: string
  itemId: string
  itemName: string
  startTime: string
  endTime?: string
  suggestedAmount: number
  paidAmount: number
  balance: number
  paymentType: "cash" | "credit" | "pending"
  customerName?: string
  paymentStatus?: "paid" | "credit" | "partially paid" | "pending"
}

interface Credit {
  creditId: string
  customerName: string
  amount: number
  status: "paid" | "unpaid"
  createdAt: string
  sessionId?: string // Link to the originating session
}

interface Payment {
  paymentId: string
  date: string
  amount: number
  method: "cash" | "credit"
  linkedSessionId: string
}

class GoogleSheetsService {
  private spreadsheetId: string
  private serviceAccountEmail: string
  private serviceAccountKey: string

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || ""
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ""
    this.serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ""

    if (!this.spreadsheetId || !this.serviceAccountEmail || !this.serviceAccountKey) {
      console.warn("Google Sheets credentials not configured. Using mock data.")
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.serviceAccountEmail || !this.serviceAccountKey) {
      throw new Error("Service account credentials not configured")
    }

    try {
      const jwt = require('jsonwebtoken')
      
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: this.serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      }

      // Clean and format the private key properly
      let privateKey = this.serviceAccountKey.trim()
      
      // Remove surrounding quotes if present (handles both single and double quotes)
      if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
          (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1)
      }
      
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n')
      
      // Remove any extra whitespace or carriage returns
      privateKey = privateKey.replace(/\r/g, '')
      
      // Debug logging (remove in production)
      console.log('Private key length:', privateKey.length)
      console.log('Private key starts with:', privateKey.substring(0, 30))
      console.log('Private key ends with:', privateKey.substring(privateKey.length - 30))
      
      // Ensure the key starts and ends with proper markers
      if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        console.error('Private key does not start with BEGIN marker. First 100 chars:', privateKey.substring(0, 100))
        throw new Error('Invalid private key format: missing BEGIN marker')
      }
      if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
        console.error('Private key does not end with END marker. Last 100 chars:', privateKey.substring(privateKey.length - 100))
        throw new Error('Invalid private key format: missing END marker')
      }
      
      console.log('Private key format check passed')
      const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
      })

      if (!response.ok) {
        throw new Error(`OAuth token request failed: ${response.status}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Error getting access token:', error)
      throw error
    }
  }

  private async appendToSheet(sheetName: string, values: any[][]): Promise<void> {
    if (!this.spreadsheetId || !this.serviceAccountEmail || !this.serviceAccountKey) {
      console.log(`[Mock] Would append to ${sheetName}:`, values, "not adding to the google sheet")
      return
    }

    try {
      const accessToken = await this.getAccessToken()
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}:append?valueInputOption=RAW`

      console.log(`[v0] Making request to Google Sheets API: ${url}`)
      console.log(`[v0] Data to append:`, values)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: values,
        }),
      })

      console.log(`[v0] Google Sheets API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] Google Sheets API error response:`, errorText)
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const responseText = await response.text()
      console.log(`[v0] Google Sheets API response:`, responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error(`[v0] Failed to parse Google Sheets response as JSON:`, parseError)
        throw new Error(`Invalid JSON response from Google Sheets API: ${responseText}`)
      }

      console.log(`[v0] Successfully added data to ${sheetName}:`, result)
    } catch (error) {
      console.error(`Error writing to ${sheetName}:`, error)
      throw error
    }
  }

  private async readFromSheet(sheetName: string, range?: string): Promise<any[][]> {
    if (!this.spreadsheetId || !this.serviceAccountEmail || !this.serviceAccountKey) {
      console.log(`[Mock] Would read from ${sheetName}`)
      return []
    }

    try {
      const accessToken = await this.getAccessToken()
      const fullRange = range ? `${sheetName}!${range}` : sheetName
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${fullRange}`

      console.log(`[v0] Reading from Google Sheets: ${url}`)

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] Google Sheets read error:`, errorText)
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error(`[v0] Failed to parse Google Sheets read response:`, parseError)
        throw new Error(`Invalid JSON response from Google Sheets API: ${responseText}`)
      }

      console.log(`[v0] Successfully read from ${sheetName}:`, data)
      return data.values || []
    } catch (error) {
      console.error(`Error reading from ${sheetName}:`, error)
      return []
    }
  }

  // Initialize the Google Sheets with proper headers
  async initializeSheets() {
    const sheets = [
      {
        name: "Boards",
        headers: ["ID", "Name", "Status", "Type", "Hourly Rate"],
      },
      {
        name: "Sessions",
        headers: [
          "Session ID",
          "Item ID",
          "Item Name",
          "Start Time",
          "End Time",
          "Suggested Amount",
          "Paid Amount",
          "Balance",
          "Payment Type",
          "Customer Name",
        ],
      },
      {
        name: "Credits",
        headers: ["Credit ID", "Customer Name", "Amount", "Status", "Created At"],
      },
      {
        name: "Payments",
        headers: ["Payment ID", "Date", "Amount", "Method", "Linked Session ID"],
      },
    ]

    // In a real implementation, this would create the sheets if they don't exist
    console.log("Initializing Google Sheets with structure:", sheets)
    return sheets
  }

  // Stations/Boards Management
  async getStations(): Promise<Station[]> {
    try {
      const values = await this.readFromSheet("Boards", "A2:E")

      if (values.length === 0) {
        console.log("[v0] No stations found in Google Sheets")
        return []
      }

      const stations = values.map((row) => ({
        id: row[0] || "",
        name: row[1] || "",
        status: (row[2] as "available" | "occupied" | "maintenance") || "available",
        type: (row[3] as "billiard" | "ps4") || "billiard",
        hourlyRate: Number(row[4]) || 0,
      }))

      console.log("[v0] Stations from Google Sheets:", stations)
      return stations
    } catch (error) {
      console.error("Error fetching stations:", error)
      return []
    }
  }

  async addStation(station: Omit<Station, "id">): Promise<Station> {
    try {
      const newStation: Station = {
        id: Date.now().toString(),
        ...station,
      }

      await this.appendToSheet("Boards", [
        [newStation.id, newStation.name, newStation.status, newStation.type, newStation.hourlyRate],
      ])

      return newStation
    } catch (error) {
      console.error("Error adding station:", error)
      throw error
    }
  }

  async updateStation(id: string, updates: Partial<Station>): Promise<void> {
    try {
      if (!this.spreadsheetId || !this.serviceAccountEmail || !this.serviceAccountKey) {
        console.log("[Mock] Would update station in Boards sheet:", { id, updates })
        return
      }

      // First, get all stations to find the row index
      const values = await this.readFromSheet("Boards", "A2:E")
      const rowIndex = values.findIndex((row) => row[0] === id)
      
      if (rowIndex === -1) {
        throw new Error(`Station with ID ${id} not found`)
      }

      // Calculate the actual row number in the sheet (add 2 because we start from A2)
      const sheetRowNumber = rowIndex + 2

      // Get the current station data
      const currentRow = values[rowIndex]
      const currentStation: Station = {
        id: currentRow[0] || "",
        name: currentRow[1] || "",
        status: (currentRow[2] as "available" | "occupied" | "maintenance") || "available",
        type: (currentRow[3] as "billiard" | "ps4") || "billiard",
        hourlyRate: Number(currentRow[4]) || 0,
      }

      // Merge updates with current data
      const updatedStation = { ...currentStation, ...updates }

      // Prepare the updated row data
      const updatedRow = [
        updatedStation.id,
        updatedStation.name,
        updatedStation.status,
        updatedStation.type,
        updatedStation.hourlyRate,
      ]

      // Update the specific row
      const accessToken = await this.getAccessToken()
      const range = `Boards!A${sheetRowNumber}:E${sheetRowNumber}`
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`

      console.log(`[v0] Updating station in Google Sheets at ${range}:`, updatedRow)

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [updatedRow],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] Google Sheets update error:`, errorText)
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`[v0] Successfully updated station in Boards:`, result)
    } catch (error) {
      console.error("Error updating station:", error)
      throw error
    }
  }

  async deleteStation(id: string): Promise<void> {
    try {
      if (!this.spreadsheetId || !this.serviceAccountEmail || !this.serviceAccountKey) {
        console.log("[Mock] Would delete station from Boards sheet:", id)
        return
      }

      // First, get all stations to find the row index
      const values = await this.readFromSheet("Boards", "A2:E")
      const rowIndex = values.findIndex((row) => row[0] === id)
      
      if (rowIndex === -1) {
        throw new Error(`Station with ID ${id} not found`)
      }

      // Calculate the actual row number in the sheet (add 2 because we start from A2)
      const sheetRowNumber = rowIndex + 2

      // Delete the row by clearing its contents and then removing the empty row
      const accessToken = await this.getAccessToken()
      
      // First clear the row
      const clearRange = `Boards!A${sheetRowNumber}:E${sheetRowNumber}`
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${clearRange}:clear`

      console.log(`[v0] Clearing station row in Google Sheets at ${clearRange}`)

      const clearResponse = await fetch(clearUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!clearResponse.ok) {
        const errorText = await clearResponse.text()
        console.error(`[v0] Google Sheets clear error:`, errorText)
        throw new Error(`Google Sheets API error: ${clearResponse.status} ${clearResponse.statusText} - ${errorText}`)
      }

      // Then delete the empty row
      const deleteUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`
      
      const deleteRequest = {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Assuming first sheet, you might need to get the actual sheet ID
              dimension: "ROWS",
              startIndex: sheetRowNumber - 1, // 0-indexed for API
              endIndex: sheetRowNumber // 0-indexed for API
            }
          }
        }]
      }

      console.log(`[v0] Deleting station row ${sheetRowNumber} from Google Sheets`)

      const deleteResponse = await fetch(deleteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(deleteRequest),
      })

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text()
        console.error(`[v0] Google Sheets delete error:`, errorText)
        throw new Error(`Google Sheets API error: ${deleteResponse.status} ${deleteResponse.statusText} - ${errorText}`)
      }

      const result = await deleteResponse.json()
      console.log(`[v0] Successfully deleted station from Boards:`, result)
    } catch (error) {
      console.error("Error deleting station:", error)
      throw error
    }
  }

  // Session Management
  async startSession(session: Omit<Session, "sessionId">): Promise<Session> {
    try {
      const newSession: Session = {
        sessionId: Date.now().toString(),
        ...session,
        startTime: new Date().toISOString(),
        suggestedAmount: 0,
        paidAmount: 0,
        balance: 0,
        paymentType: "pending" as any, // Set as pending initially
        paymentStatus: "pending" as any, // Set as pending initially
      }

      console.log("[v0] Starting session with data:", newSession)

      await this.appendToSheet("Sessions", [
        [
          newSession.sessionId,           // A: Session ID
          newSession.itemId,              // B: Item ID
          newSession.itemName,            // C: Item Name
          newSession.startTime,           // D: Start Time
          "",                             // E: End time (empty for active sessions)
          newSession.suggestedAmount,     // F: Suggested Amount
          newSession.paidAmount,          // G: Paid Amount
          newSession.balance,             // H: Balance
          "pending",                      // I: Payment Type (pending for new sessions)
          newSession.customerName || "",  // J: Customer Name
          "pending",                      // K: Payment Status (pending for new sessions)
        ],
      ])

      return newSession
    } catch (error) {
      console.error("Error starting session:", error)
      throw error
    }
  }

  async endSession(
    sessionId: string,
    endData: {
      endTime: string
      suggestedAmount: number
      paidAmount: number
      paymentType: "cash" | "credit"
      customerName?: string
    },
  ): Promise<void> {
    try {
      if (!this.spreadsheetId || !this.serviceAccountEmail || !this.serviceAccountKey) {
        console.log("[Mock] Would end session in Sessions sheet:", sessionId, endData)
        return
      }

      const balance = endData.suggestedAmount - endData.paidAmount

      // Determine payment status based on payment details
      let paymentStatus: "paid" | "credit" | "partially paid"
      if (endData.paidAmount === 0) {
        paymentStatus = "credit"
      } else if (endData.paidAmount < endData.suggestedAmount) {
        paymentStatus = "partially paid"
      } else {
        paymentStatus = "paid"
      }

      // Find the existing session row and update it
      const values = await this.readFromSheet("Sessions", "A2:K")
      const rowIndex = values.findIndex((row) => row[0] === sessionId)
      
      if (rowIndex === -1) {
        throw new Error(`Session with ID ${sessionId} not found`)
      }

      // Calculate the actual row number in the sheet (add 2 because we start from A2)
      const sheetRowNumber = rowIndex + 2

      // Get the current session data to preserve existing values
      const currentRow = values[rowIndex]
      
      // Update the session row with completion data
      const updatedRow = [
        sessionId,                          // A: Session ID (keep original)
        currentRow[1] || "",                // B: Item ID (preserve)
        currentRow[2] || "",                // C: Item Name (preserve)
        currentRow[3] || "",                // D: Start Time (preserve)
        endData.endTime,                    // E: End Time (update)
        endData.suggestedAmount,            // F: Suggested Amount (update)
        endData.paidAmount,                 // G: Paid Amount (update)
        balance,                            // H: Balance (update)
        endData.paymentType,                // I: Payment Type (update)
        endData.customerName || currentRow[9] || "", // J: Customer Name (update or preserve)
        paymentStatus,                      // K: Payment Status (update)
      ]

      // Update the specific row
      const accessToken = await this.getAccessToken()
      const range = `Sessions!A${sheetRowNumber}:K${sheetRowNumber}`
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`

      console.log(`[v0] Updating session in Google Sheets at ${range}:`, updatedRow)

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [updatedRow],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] Google Sheets update error:`, errorText)
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`[v0] Successfully updated session in Sessions:`, result)

      // If there's a balance, create a credit record for the remaining amount
      if (balance > 0 && endData.customerName) {
        await this.addCredit({
          customerName: endData.customerName,
          amount: balance,
          status: "unpaid",
          sessionId: sessionId, // Link the credit to this session
        })
        console.log(`[v0] Added credit record for ${endData.customerName}: Rs. ${balance} linked to session ${sessionId}`)
      }

      // Add payment record only if payment was made
      if (endData.paidAmount > 0) {
        await this.addPayment({
          date: new Date().toISOString(),
          amount: endData.paidAmount,
          method: endData.paymentType,
          linkedSessionId: sessionId,
        })
      }
    } catch (error) {
      console.error("Error ending session:", error)
      throw error
    }
  }

  async getActiveSessions(): Promise<Session[]> {
    try {
      // Reading A2:K since you now have Payment Status in K1
      const values = await this.readFromSheet("Sessions", "A2:K") 

      console.log("[v0] Raw session data from Google Sheets:", values)

      const activeSessions = values
        .filter((row) => {
          const paymentStatus = row[10] || "pending" // Column K: Payment Status
          
          // Only show sessions with "pending" payment status
          return paymentStatus === "pending"
        })
        .map((row) => ({
          sessionId: row[0] || "",                                    // A: Session ID
          itemId: row[1] || "",                                       // B: Item ID  
          itemName: row[2] || "",                                     // C: Item Name
          startTime: row[3] || new Date().toISOString(),              // D: Start Time
          endTime: row[4] || undefined,                               // E: End Time
          suggestedAmount: Number(row[5]) || 0,                       // F: Suggested Amount
          paidAmount: Number(row[6]) || 0,                            // G: Paid Amount
          balance: Number(row[7]) || 0,                               // H: Balance
          paymentType: (row[8] as "cash" | "credit" | "pending") || "pending",       // I: Payment Type
          customerName: row[9] || undefined,                          // J: Customer Name
          paymentStatus: (row[10] as "paid" | "credit" | "partially paid" | "pending") || "pending", // K: Payment Status
        }))

      console.log("[v0] Active sessions from Google Sheets (filtered by payment status):", activeSessions)
      return activeSessions
    } catch (error) {
      console.error("Error fetching active sessions:", error)
      return []
    }
  }

  // Credits Management
  async getCredits(): Promise<Credit[]> {
    try {
      const values = await this.readFromSheet("Credits", "A2:F") // Extended to F to include Session ID

      const credits = values.map((row) => ({
        creditId: row[0] || "",
        customerName: row[1] || "",
        amount: Number(row[2]) || 0,
        status: (row[3] as "paid" | "unpaid") || "unpaid",
        createdAt: row[4] || new Date().toISOString(),
        sessionId: row[5] || undefined, // F: Session ID
      }))

      console.log("[v0] Credits from Google Sheets:", credits)
      return credits
    } catch (error) {
      console.error("Error fetching credits:", error)
      return []
    }
  }

  async addCredit(credit: Omit<Credit, "creditId" | "createdAt">): Promise<Credit> {
    try {
      const newCredit: Credit = {
        creditId: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...credit,
      }

      await this.appendToSheet("Credits", [
        [
          newCredit.creditId,     // A: Credit ID
          newCredit.customerName, // B: Customer Name
          newCredit.amount,       // C: Amount
          newCredit.status,       // D: Status
          newCredit.createdAt,    // E: Created At
          newCredit.sessionId || "", // F: Session ID (new column)
        ],
      ])

      console.log(`[v0] Added credit record linked to session ${newCredit.sessionId}:`, newCredit)
      return newCredit
    } catch (error) {
      console.error("Error adding credit:", error)
      throw error
    }
  }

  async markCreditAsPaid(creditId: string): Promise<void> {
    try {
      if (!this.spreadsheetId || !this.serviceAccountEmail || !this.serviceAccountKey) {
        console.log("[Mock] Would mark credit as paid in Credits sheet:", creditId)
        return
      }

      // First, get all credits to find the row index and session ID
      const values = await this.readFromSheet("Credits", "A2:F")
      const rowIndex = values.findIndex((row) => row[0] === creditId)
      
      if (rowIndex === -1) {
        throw new Error(`Credit with ID ${creditId} not found`)
      }

      // Calculate the actual row number in the sheet (add 2 because we start from A2)
      const sheetRowNumber = rowIndex + 2

      // Get the current credit data to preserve existing values
      const currentRow = values[rowIndex]
      const sessionId = currentRow[5] // F: Session ID
      
      // Update the credit row with paid status
      const updatedRow = [
        creditId,                           // A: Credit ID (keep original)
        currentRow[1] || "",                // B: Customer Name (preserve)
        currentRow[2] || 0,                 // C: Amount (preserve)
        "paid",                             // D: Status (update to "paid")
        currentRow[4] || new Date().toISOString(), // E: Created At (preserve)
        sessionId || "",                    // F: Session ID (preserve)
      ]

      // Update the specific row in Credits sheet
      const accessToken = await this.getAccessToken()
      const range = `Credits!A${sheetRowNumber}:F${sheetRowNumber}`
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`

      console.log(`[v0] Updating credit status in Google Sheets at ${range}:`, updatedRow)

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [updatedRow],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] Google Sheets update error:`, errorText)
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`[v0] Successfully updated credit status to paid:`, result)

      // Also update the corresponding session's payment status if we have a sessionId
      if (sessionId) {
        await this.updateSessionPaymentStatus(sessionId, "paid")
      }

      // Add a payment record for the credit payment
      const creditAmount = Number(currentRow[2]) || 0
      const customerName = currentRow[1] || ""
      
      if (creditAmount > 0) {
        await this.addPayment({
          date: new Date().toISOString(),
          amount: creditAmount,
          method: "cash", // Assuming credit payments are settled in cash
          linkedSessionId: sessionId || "",
        })
        console.log(`[v0] Added payment record for credit settlement: Rs. ${creditAmount}`)
      }
    } catch (error) {
      console.error("Error marking credit as paid:", error)
      throw error
    }
  }

  // Helper method to update session payment status
  private async updateSessionPaymentStatus(sessionId: string, paymentStatus: "paid" | "credit" | "partially paid" | "pending"): Promise<void> {
    try {
      // Get all sessions to find the row index
      const sessionValues = await this.readFromSheet("Sessions", "A2:K")
      const sessionRowIndex = sessionValues.findIndex((row) => row[0] === sessionId)
      
      if (sessionRowIndex === -1) {
        console.warn(`Session with ID ${sessionId} not found, cannot update payment status`)
        return
      }

      // Calculate the actual row number in the sheet (add 2 because we start from A2)
      const sessionSheetRowNumber = sessionRowIndex + 2

      // Get the current session data to preserve existing values
      const currentSessionRow = sessionValues[sessionRowIndex]
      
      // When marking as paid, update the financial fields to reflect full payment
      let updatedPaidAmount = currentSessionRow[6] || 0  // G: Current Paid Amount
      let updatedBalance = currentSessionRow[7] || 0     // H: Current Balance
      
      if (paymentStatus === "paid") {
        // If marking as paid, set paid amount = suggested amount and balance = 0
        const suggestedAmount = Number(currentSessionRow[5]) || 0  // F: Suggested Amount
        updatedPaidAmount = suggestedAmount  // Full payment
        updatedBalance = 0  // No remaining balance
        console.log(`[v0] Updating session ${sessionId}: Paid Amount: ${updatedPaidAmount}, Balance: ${updatedBalance}`)
      }
      
      // Update the session row with new payment status and financial fields
      const updatedSessionRow = [
        currentSessionRow[0] || "",         // A: Session ID (preserve)
        currentSessionRow[1] || "",         // B: Item ID (preserve) 
        currentSessionRow[2] || "",         // C: Item Name (preserve)
        currentSessionRow[3] || "",         // D: Start Time (preserve)
        currentSessionRow[4] || "",         // E: End Time (preserve)
        currentSessionRow[5] || 0,          // F: Suggested Amount (preserve)
        updatedPaidAmount,                  // G: Paid Amount (update for paid status)
        updatedBalance,                     // H: Balance (update for paid status)  
        currentSessionRow[8] || "",         // I: Payment Type (preserve)
        currentSessionRow[9] || "",         // J: Customer Name (preserve)
        paymentStatus,                      // K: Payment Status (update)
      ]

      // Update the specific row in Sessions sheet
      const accessToken = await this.getAccessToken()
      const sessionRange = `Sessions!A${sessionSheetRowNumber}:K${sessionSheetRowNumber}`
      const sessionUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sessionRange}?valueInputOption=RAW`

      console.log(`[v0] Updating session payment status in Google Sheets at ${sessionRange}:`, updatedSessionRow)

      const sessionResponse = await fetch(sessionUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [updatedSessionRow],
        }),
      })

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text()
        console.error(`[v0] Google Sheets session update error:`, errorText)
        throw new Error(`Google Sheets API error: ${sessionResponse.status} ${sessionResponse.statusText} - ${errorText}`)
      }

      const sessionResult = await sessionResponse.json()
      console.log(`[v0] Successfully updated session ${sessionId} payment status to ${paymentStatus}:`, sessionResult)
    } catch (error) {
      console.error(`Error updating session ${sessionId} payment status:`, error)
      throw error
    }
  }

  // Payments and Reports
  async addPayment(payment: Omit<Payment, "paymentId">): Promise<Payment> {
    try {
      const newPayment: Payment = {
        paymentId: Date.now().toString(),
        ...payment,
      }

      await this.appendToSheet("Payments", [
        [newPayment.paymentId, newPayment.date, newPayment.amount, newPayment.method, newPayment.linkedSessionId],
      ])

      return newPayment
    } catch (error) {
      console.error("Error adding payment:", error)
      throw error
    }
  }

  async getRevenueData(period: "daily" | "weekly" | "monthly"): Promise<any[]> {
    try {
      // Mock revenue data for demo
      const mockData = {
        daily: [
          { name: "Mon", revenue: 240, sessions: 12 },
          { name: "Tue", revenue: 320, sessions: 16 },
          { name: "Wed", revenue: 180, sessions: 9 },
          { name: "Thu", revenue: 420, sessions: 21 },
          { name: "Fri", revenue: 680, sessions: 34 },
          { name: "Sat", revenue: 890, sessions: 45 },
          { name: "Sun", revenue: 750, sessions: 38 },
        ],
        weekly: [
          { name: "Week 1", revenue: 2400, sessions: 120 },
          { name: "Week 2", revenue: 2800, sessions: 140 },
          { name: "Week 3", revenue: 3200, sessions: 160 },
          { name: "Week 4", revenue: 2900, sessions: 145 },
        ],
        monthly: [
          { name: "Jan", revenue: 12400, sessions: 620 },
          { name: "Feb", revenue: 11200, sessions: 560 },
          { name: "Mar", revenue: 14800, sessions: 740 },
          { name: "Apr", revenue: 13600, sessions: 680 },
          { name: "May", revenue: 16200, sessions: 810 },
          { name: "Jun", revenue: 18900, sessions: 945 },
        ],
      }

      console.log(`[Google Sheets] Fetching ${period} revenue data from Payments sheet`)
      return mockData[period]
    } catch (error) {
      console.error("Error fetching revenue data:", error)
      throw error
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService()

// Helper function to convert array data to sheet format
export function arrayToSheetData(data: any[][]): SheetData {
  return {
    range: "A1",
    values: data,
  }
}
