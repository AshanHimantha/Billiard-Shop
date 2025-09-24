-- Google Sheets Database Structure Setup
-- This script documents the required Google Sheets structure

-- Sheet 1: Boards
-- Columns: ID, Name, Status, Type, Hourly Rate
-- Example data:
-- 1, "Billiard Table 1", "available", "billiard", 15
-- 2, "Billiard Table 2", "occupied", "billiard", 15
-- 3, "PS4 Station 1", "available", "ps4", 12
-- 4, "PS4 Station 2", "maintenance", "ps4", 12

-- Sheet 2: Sessions
-- Columns: Session ID, Item ID, Item Name, Start Time, End Time, Suggested Amount, Paid Amount, Balance, Payment Type, Customer Name
-- Example data:
-- "sess_001", "1", "Billiard Table 1", "2024-01-15T10:00:00Z", "2024-01-15T12:00:00Z", 30, 30, 0, "cash", "John Doe"

-- Sheet 3: Credits
-- Columns: Credit ID, Customer Name, Amount, Status, Created At
-- Example data:
-- "cred_001", "Alice Johnson", 25, "unpaid", "2024-01-15T10:00:00Z"

-- Sheet 4: Payments
-- Columns: Payment ID, Date, Amount, Method, Linked Session ID
-- Example data:
-- "pay_001", "2024-01-15T12:00:00Z", 30, "cash", "sess_001"

-- To set up your Google Sheets:
-- 1. Create a new Google Spreadsheet
-- 2. Create 4 sheets with the names: Boards, Sessions, Credits, Payments
-- 3. Add the column headers as specified above
-- 4. Get your Spreadsheet ID from the URL
-- 5. Create a Google Sheets API key
-- 6. Add both to your environment variables:
--    GOOGLE_SHEETS_ID=your-spreadsheet-id
--    GOOGLE_SHEETS_API_KEY=your-api-key

SELECT 'Google Sheets structure documented' as status;
