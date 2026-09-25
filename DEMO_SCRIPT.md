# FundsRoom ERP — Demo Video Script
## Duration: 5–7 minutes
## Flow: Login → Inventory → Work Order → Transfer → Order Reservation

---

## BEFORE YOU START (30 seconds prep, don't record)

Make sure these are running:
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open browser at: **http://localhost:3000**

Re-seed the database for a clean state:
```bash
cd backend && npm run seed
```

Have these tabs ready in browser (don't show yet):
- Tab 1: http://localhost:3000 (Login page)

---

## SEGMENT 1 — Introduction (0:00 – 0:30)

**[Screen: Show the Login page]**

> "This is FundsRoom — a Mini Operations ERP built as a full-stack application.
> The backend runs on Node.js with Express, the database is PostgreSQL with
> Sequelize ORM, and the frontend is React with Tailwind CSS.
>
> The system covers the core ERP flow:
> Inventory → Work Orders → Stock Transfers → Customer Order Reservation.
>
> Let me walk you through each module."

---

## SEGMENT 2 — Login & Role-Based Access (0:30 – 1:15)

**[Screen: Login page at localhost:3000]**

> "The system has three roles — Admin, Operations, and Sales.
> Each role has different permissions enforced at the backend level."

**ACTION: Log in as Admin**
- Email: `admin@fundsroom.com`
- Password: `Admin@123`
- Click **Sign In**

> "I'm now logged in as Admin. The dashboard shows live counts for Inventory,
> Work Orders, Transfers, and Customer Orders — all pulled from PostgreSQL."

**[Screen: Dashboard showing stat cards]**

> "Admin can access every module. Notice the role shown in the welcome banner."

**ACTION: Quickly logout, then log in as Operations**
- Email: `ops@fundsroom.com`
- Password: `Ops@123`

> "Operations users manage inventory and handle transfers. They cannot create
> Work Orders — that's restricted to Admin only."

**ACTION: Log back in as Admin** for the rest of the demo.
- Email: `admin@fundsroom.com`
- Password: `Admin@123`

---

## SEGMENT 3 — Inventory Module (1:15 – 2:15)

**[ACTION: Click "Inventory" in the sidebar]**

> "The Inventory page shows all stock records. Each record tracks:
> - Physical Quantity — what's physically in the warehouse
> - Reserved Quantity — stock held for pending orders
> - Available Quantity — calculated as Physical minus Reserved"

**[Screen: Inventory table with colored Available Qty column]**

> "Available quantity is color-coded — green means healthy stock, amber means
> low, red means zero. This is enforced both visually and at the database level."

**ACTION: Click "Add Inventory" button**

> "I'll add a new inventory record to show how it works."

- Select Item: **Standing Desk**
- Select Location: **Store C**
- Batch: `DEFAULT`
- Physical Qty: `100`
- Reserved Qty: `0`
- Click **Add Record**

> "The record is created instantly. Physical: 100, Reserved: 0, Available: 100."

**[Screen: New row appears in table]**

> "The system prevents negative inventory and stops reservations beyond available
> stock — both validated at the backend and database level using PostgreSQL
> transactions."

---

## SEGMENT 4 — Work Orders (2:15 – 3:15)

**[ACTION: Click "Work Orders" in the sidebar]**

> "Work Orders let an Admin assign material tasks to Operations users.
> The system automatically calculates shortage — if required quantity exceeds
> what's available at the location."

**ACTION: Click "Create Work Order"**

- Location: **Warehouse A**
- Item: **Wireless Mouse**
- Required Qty: `500`
- Assign To: select **Operations Manager**
- Notes: `Urgent production run`
- Click **Create**

> "The work order is created with status Assigned. Notice the shortage field —
> there are 175 units available but we need 500, so shortage is 325.
> This tells operations exactly how much stock to source."

**[Screen: Work Order row showing WO-XXXXXX, shortage=325]**

> "Statuses progress from Assigned → In Progress → Completed.
> Operations users can update the status from the dropdown in this table."

**ACTION: Change the status dropdown from Assigned to InProgress**

> "The status updates in real time. Only Admin can create work orders —
> if an Operations user tries, the backend returns a 403 Forbidden."

---

## SEGMENT 5 — Internal Stock Transfer (3:15 – 4:30)

**[ACTION: Click "Transfers" in the sidebar]**

> "Internal Transfers move stock between locations. The flow has three stages:
> Requested → Dispatched → Received.
> Business rules are enforced at each stage."

**ACTION: Click "New Transfer"**

- From Location: **Warehouse A**
- To Location: **Warehouse B**
- Item: **Laptop Pro 15**
- Quantity: `10`
- Click **Create Transfer**

> "Transfer is now in Requested status. At this point no inventory has moved."

**[Screen: Transfer row showing TRF-XXXXXX, status=Requested]**

> "Now I'll dispatch it. This is the moment source inventory reduces."

**ACTION: Click "Dispatch" button on the new transfer**

> "Dispatched. The source — Warehouse A — has just had 10 Laptop units
> removed from its physical quantity. That happens inside a PostgreSQL
> transaction, atomically."

**[ACTION: Navigate to Inventory, filter by Warehouse A, show Laptop quantity reduced]**

> "See here — Warehouse A Laptop inventory has decreased by 10.
> But Warehouse B has not received anything yet."

**[ACTION: Go back to Transfers]**

> "Now I'll receive the transfer."

**ACTION: Click "Receive" button on the dispatched transfer**

> "Received. Warehouse B inventory now increases by 10.
> Let me verify."

**[ACTION: Navigate to Inventory, filter by Warehouse B, show Laptop quantity increased]**

> "Warehouse B now has the 10 units. The business rule — destination only
> increases on receipt — is working correctly."

**[ACTION: Go back to Transfers, try clicking Receive again on same transfer]**

> "If I try to receive the same transfer again, the system blocks it.
> The transfer is already Received — duplicate receipt is prevented
> at the backend level."

---

## SEGMENT 6 — Customer Order & Stock Reservation (4:30 – 5:45)

**[ACTION: Click "Customer Orders" in the sidebar]**

> "Customer Orders let Sales users create orders and reserve stock.
> Reservation is the critical operation — it must be atomic to prevent
> two users from reserving more stock than exists."

**ACTION: Click "New Order"**

- Customer Name: `Global Tech Ltd`
- Email: `buyer@globaltech.com`
- Phone: `9876543210`
- Item: **Wireless Mouse**
- Location: **Warehouse A**
- Quantity: `50`
- Click **Create Order**

> "Order is created with Pending status. No stock is reserved yet."

**[Screen: Order row showing ORD-XXXXXX, status=Pending]**

**ACTION: Click "Reserve" button on the order**

> "Now I reserve the stock. This runs a PostgreSQL transaction that:
> - Checks available quantity
> - Increments reserved quantity
> - Updates order status to Reserved
> All in one atomic operation."

**[Screen: Order status changes to Reserved]**

> "Let me show the inventory to confirm the reservation."

**[ACTION: Navigate to Inventory, show Wireless Mouse at Warehouse A]**

> "Reserved quantity has increased by 50. Available quantity has decreased
> by 50. Physical quantity is unchanged — the stock is still physically there,
> just held for this order."

**[ACTION: Go back to Customer Orders]**

> "Now I'll demonstrate over-reservation prevention."

**ACTION: Click "New Order" again**

- Customer Name: `Overflow Corp`
- Item: **Wireless Mouse**
- Location: **Warehouse A**
- Quantity: `99999`
- Click **Create Order**, then click **Reserve**

> "The system rejects this. The error message tells us exactly what's available
> versus what was requested. Two concurrent requests cannot both succeed —
> this is enforced at the database level using row-level locking in the
> PostgreSQL transaction."

**[Screen: Error toast showing insufficient stock message]**

> "Finally, let me cancel the first order to show stock release."

**ACTION: Click "Cancel" on the first Reserved order**

> "Order cancelled. The reserved quantity is released back to available."

**[ACTION: Navigate to Inventory, show Wireless Mouse reserved quantity decreased]**

> "The 50 units are available again. The cancel → release flow works correctly."

---

## SEGMENT 7 — Wrap-Up (5:45 – 6:15)

**[Screen: Navigate back to Dashboard]**

> "To summarize what this system covers:
>
> - Role-based access control — Admin, Operations, and Sales with backend enforcement
> - Inventory management — physical, reserved, and available quantities
> - Work orders — with automatic shortage calculation
> - Internal transfers — Requested → Dispatched → Received, with atomic inventory updates
> - Customer orders — atomic stock reservation preventing race conditions
>
> The database is PostgreSQL with Sequelize ORM. All critical operations use
> transactions to ensure data consistency.
>
> The 5 mandatory test cases from the case study all pass — including
> over-reservation prevention, double-receipt prevention, and authorization checks."

**[Screen: Optionally show a terminal running npm test with passing tests]**

> "Thank you for watching."

---

## RECORDING TIPS

| Tip | Detail |
|-----|--------|
| Resolution | 1920×1080 minimum |
| Keep browser zoomed | 110–125% so text is readable |
| Use OBS or Loom | Free screen recorder |
| Pause between actions | 1–2 seconds so viewers can follow |
| Keep terminal hidden | Unless showing test results at the end |
| Don't rush | Speak clearly, ~130 words per minute |
| Total runtime | Aim for 5:30–6:30 minutes |

---

## QUICK REFERENCE — Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@fundsroom.com | Admin@123 | admin |
| Operations | ops@fundsroom.com | Ops@123 | operations |
| Sales | sales@fundsroom.com | Sales@123 | sales |

---

## QUICK REFERENCE — Demo Data Used

| What | Value |
|------|-------|
| Transfer: source | Warehouse A |
| Transfer: dest | Warehouse B |
| Transfer: item | Laptop Pro 15 |
| Transfer: qty | 10 |
| Work Order: location | Warehouse A |
| Work Order: item | Wireless Mouse |
| Work Order: required | 500 (shows shortage) |
| Order: item | Wireless Mouse |
| Order: location | Warehouse A |
| Order: qty | 50 |

---

## BACKUP — If Something Goes Wrong

**Reset everything:**
```bash
cd backend
npm run seed
```

**Backend not starting:**
```bash
# Kill whatever is on port 5000
npx kill-port 5000
npm run dev
```

**Frontend blank page:**
```bash
cd frontend
npm run dev
# Make sure .env has VITE_API_URL=http://localhost:5000/api
```

**Database error:**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# If tables are out of sync, force-reset
cd backend
node -e "require('./models').sequelize.sync({force:true}).then(()=>process.exit())"
npm run seed
```
