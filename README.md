# FundsRoom — Mini Operations ERP

A production-oriented full-stack Operations ERP built with **Node.js + React + PostgreSQL** and **Tailwind CSS**.

## Tech Stack

| Layer         | Technology                        |
| ------------- | --------------------------------- |
| Frontend      | React 18 + Vite + Tailwind CSS v3 |
| Backend       | Node.js + Express.js              |
| Database      | PostgreSQL + Sequelize ORM        |
| Auth          | JWT (JSON Web Tokens)             |
| Icons         | Lucide React                      |
| Notifications | React Hot Toast                   |

## Modules

1. **Authentication & Roles** — Admin, Operations User, Sales User with role-based authorization
2. **Inventory Management** — Item, Category, Location, Batch, Physical/Reserved/Available Qty
3. **Work Orders** — Create, assign, track material shortages with automatic calculations
4. **Internal Stock Transfers** — Requested → Dispatched → Received flow with atomic inventory updates
5. **Customer Orders** — Reserve stock with concurrency-safe transactions and cancellation

## Project Setup

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** 12+ (local or cloud instance)
- **npm** or **yarn**

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure PostgreSQL

Make sure PostgreSQL is running. Create a new database:

```bash
# Using psql
createdb fundsroom
```

Or connect to your PostgreSQL instance and run:

```sql
CREATE DATABASE fundsroom;
```

### 3. Environment Variables

Create `backend/.env` with PostgreSQL connection details:

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fundsroom
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
```

**For Frontend**, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup & Seed

```bash
cd backend
npm run seed
```

This will:

- Create all necessary tables in PostgreSQL
- Populate with default users, locations, and items

**Default Users:**

| Email               | Password  | Role       |
| ------------------- | --------- | ---------- |
| admin@fundsroom.com | Admin@123 | Admin      |
| ops@fundsroom.com   | Ops@123   | Operations |
| sales@fundsroom.com | Sales@123 | Sales      |

### 5. Run the Application

**Terminal 1 — Backend**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## How to Test

```bash
cd backend
npm test
```

**Test Coverage (5 core test cases):**

| Test   | Scenario                                                |
| ------ | ------------------------------------------------------- |
| Test 1 | Cannot reserve more than available inventory            |
| Test 2 | Cannot transfer more than available inventory           |
| Test 3 | Destination stock increases only after transfer receipt |
| Test 4 | Same transfer cannot be received twice                  |
| Test 5 | Unauthorized user cannot perform restricted operation   |

## API Documentation

### Authentication

| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| POST   | `/api/auth/login` | Login and get JWT token  |
| GET    | `/api/auth/me`    | Get current user profile |

### Inventory Management

| Method | Endpoint                    | Role       | Description                |
| ------ | --------------------------- | ---------- | -------------------------- |
| GET    | `/api/inventory`            | All        | List all inventory records |
| POST   | `/api/inventory`            | Admin, Ops | Create/upsert inventory    |
| GET    | `/api/inventory/:id`        | All        | Get single record          |
| PATCH  | `/api/inventory/:id/adjust` | Admin, Ops | Adjust physical quantity   |
| DELETE | `/api/inventory/:id`        | Admin      | Delete (soft delete)       |

### Work Orders

| Method | Endpoint                     | Role  | Description                                       |
| ------ | ---------------------------- | ----- | ------------------------------------------------- |
| GET    | `/api/workorders`            | All   | List work orders                                  |
| POST   | `/api/workorders`            | Admin | Create new work order                             |
| GET    | `/api/workorders/:id`        | All   | Get single work order                             |
| PATCH  | `/api/workorders/:id/status` | Ops   | Update status (Assigned → InProgress → Completed) |

### Internal Transfers

| Method | Endpoint                      | Role       | Description                     |
| ------ | ----------------------------- | ---------- | ------------------------------- |
| GET    | `/api/transfers`              | All        | List all transfers              |
| POST   | `/api/transfers`              | Admin, Ops | Create transfer request         |
| GET    | `/api/transfers/:id`          | All        | Get single transfer             |
| PATCH  | `/api/transfers/:id/dispatch` | Admin, Ops | Dispatch (reduces source)       |
| PATCH  | `/api/transfers/:id/receive`  | Admin, Ops | Receive (increases destination) |

### Customer Orders

| Method | Endpoint                  | Role         | Description            |
| ------ | ------------------------- | ------------ | ---------------------- |
| GET    | `/api/orders`             | All          | List customer orders   |
| POST   | `/api/orders`             | Admin, Sales | Create order           |
| GET    | `/api/orders/:id`         | All          | Get single order       |
| PATCH  | `/api/orders/:id/reserve` | All          | Reserve stock (atomic) |
| PATCH  | `/api/orders/:id/fulfill` | Admin, Ops   | Fulfill & dispatch     |
| PATCH  | `/api/orders/:id/cancel`  | Admin, Sales | Cancel & release stock |

### Items & Locations

| Method | Endpoint         | Role       | Description           |
| ------ | ---------------- | ---------- | --------------------- |
| GET    | `/api/items`     | All        | List active items     |
| POST   | `/api/items`     | Admin, Ops | Create item           |
| GET    | `/api/locations` | All        | List active locations |
| POST   | `/api/locations` | Admin      | Create location       |

## Database Schema

**Tables:**

- `Users` — Authentication, role-based access
- `Locations` — Warehouse/store locations
- `Items` — Products/components
- `Inventory` — Stock levels per item/location/batch
- `WorkOrders` — Internal work assignments
- `Transfers` — Inter-location stock movements
- `CustomerOrders` — Customer order reservations

**Key Relationships:**

```
Inventory
  ├─ itemId → Items.id
  └─ locationId → Locations.id
  └─ Unique: (itemId, locationId, batch)

WorkOrder
  ├─ itemId → Items.id
  ├─ locationId → Locations.id
  ├─ assignedUserId → Users.id
  └─ createdById → Users.id

Transfer
  ├─ itemId → Items.id
  ├─ sourceLocationId → Locations.id
  ├─ destLocationId → Locations.id
  └─ createdById/updatedById → Users.id

CustomerOrder
  ├─ itemId → Items.id
  ├─ locationId → Locations.id
  └─ createdById/updatedById → Users.id
```

## Key Business Rules

### Inventory Constraints

- `availableQty = physicalQty - reservedQty` (must always be ≥ 0)
- Physical quantity cannot go negative
- Reserved quantity cannot exceed physical quantity
- Unique constraint on (itemId, locationId, batch)

### Transfer Flow

1. **Requested** — Initial state, validates source availability
2. **Dispatched** — Source inventory physically decreases
3. **Received** — Destination inventory increases (idempotent-safe)
4. **Cancelled** — Only from Requested state

### Order Reservation

- Uses Sequelize transactions for atomicity
- Prevents race conditions (two users can't over-reserve simultaneously)
- Released stock on cancel if order is Reserved or Pending
- Statuses: Pending → Reserved → Fulfilled OR Cancelled

### Work Order Shortage

- Automatically calculates `shortageQty = max(0, requiredQty - availableQty)`
- `availableQtyAtCreation` stored as reference for audit trail
- Statuses: Assigned → InProgress → Completed

## Authorization Rules

| Role           | Permissions                                                                            |
| -------------- | -------------------------------------------------------------------------------------- |
| **Admin**      | Create/manage everything, approve transfers, create work orders, delete records        |
| **Operations** | Manage inventory, dispatch/receive transfers, fulfill orders, update work order status |
| **Sales**      | Create customer orders, reserve stock, cancel orders                                   |

## Troubleshooting

### PostgreSQL Connection Error

- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check DB credentials in `.env` match PostgreSQL setup
- Ensure database `fundsroom` exists

### Port Already in Use

- Backend (5000): `lsof -i :5000` and kill the process, or change PORT in `.env`
- Frontend (5173): `lsof -i :5173` and kill the process

### Database Reset

```bash
dropdb fundsroom
createdb fundsroom
npm run seed
```

### Test Failures

- Ensure PostgreSQL is running
- Check `.env` file is properly configured
- Run `npm run seed` before tests

## Development Workflow

This project demonstrates proper git history with incremental commits:

```bash
git log --oneline
# Shows commits for: models, controllers, migrations, middleware, tests, docs
```

Each significant feature or component has its own commit, showing development progression.

## Performance Considerations

- **Inventory Transactions**: All stock operations use database transactions to prevent race conditions
- **Indexes**: Compound unique index on `(itemId, locationId, batch)` for fast lookups
- **Connection Pool**: Sequelize configured with connection pooling for better throughput
- **Lazy Loading**: Relations are loaded on-demand to minimize query overhead

## Security Notes

- Passwords are hashed with bcryptjs (12 salt rounds)
- JWT tokens expire after 7 days (configurable)
- Role-based access control enforced at middleware level
- Requests without valid token are rejected at `/api/*` routes
- SQL injection prevented via Sequelize parameterized queries

## API Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fundsroom.com","password":"Admin@123"}'
```

### Create Order & Reserve Stock

```bash
# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Acme Corp",
    "customerEmail": "buyer@acme.com",
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "quantity": 50
  }'

# Reserve stock (atomic)
curl -X PATCH http://localhost:5000/api/orders/ORDER_ID/reserve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create & Execute Transfer

```bash
# Create transfer request
curl -X POST http://localhost:5000/api/transfers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLocationId": "loc-uuid-1",
    "destLocationId": "loc-uuid-2",
    "itemId": "item-uuid",
    "quantity": 100
  }'

# Dispatch (source reduces)
curl -X PATCH http://localhost:5000/api/transfers/TRANSFER_ID/dispatch \
  -H "Authorization: Bearer YOUR_TOKEN"

# Receive (destination increases, prevents double receipt)
curl -X PATCH http://localhost:5000/api/transfers/TRANSFER_ID/receive \
  -H "Authorization: Bearer YOUR_TOKEN"
```
