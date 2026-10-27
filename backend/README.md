# VI Customs Brokers & Logistics — Backend API

Production-grade Fastify + TypeScript + Drizzle ORM backend for the **VI Customs Brokers & Logistics / WereHouse** system.

---

## 1. Project Purpose

This backend provides a scalable, type-safe API foundation designed to replace frontend mock data and `localStorage` with real PostgreSQL persistence while preserving 100% of existing frontend business workflows, data models, and UI behaviors:

```text
Warehouse Intake
  → Warehouse Receipt (WR)
  → Cargo Pieces
  → House Bill of Lading (HBL)
  → Consolidation (Container Packing)
  → Master Bill of Lading (MBL)
  → Shipping Manifest (CSV / XML)
  → Ocean Shipment Tracking
  → Destination Port Agent Portal
  → Financial / Documentation Hold & Release
  → Delivery & Discharge
```

---

## 2. Technology Stack

- **Runtime:** Node.js (v20+ / v22 LTS)
- **Language:** TypeScript 5.7+ (Strict Mode)
- **Web Framework:** Fastify 5
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (v14+)
- **Migration & Schema Tool:** Drizzle Kit
- **Validation:** Zod
- **Authentication:** `@fastify/jwt` + `bcryptjs`
- **Security & CORS:** `@fastify/cors`
- **Configuration:** Typed, fail-fast environment validation with Zod

---

## 3. Folder Structure

```text
backend/
├── src/
│   ├── app.ts                          # Fastify app factory (plugins, error handling, routes)
│   ├── server.ts                       # Server bootstrap & graceful shutdown
│   │
│   ├── config/
│   │   ├── env.ts                      # Zod-validated environment config
│   │   └── constants.ts                # Application constants & conversion ratios
│   │
│   ├── db/
│   │   ├── client.ts                   # PostgreSQL connection pool & health checks
│   │   ├── index.ts                    # Singleton Drizzle instance & exports
│   │   ├── migrate.ts                  # Programmatic migration runner
│   │   ├── seed.ts                     # Safe development seeding script
│   │   └── schema/                     # 20 Drizzle schema definitions
│   │       ├── index.ts
│   │       ├── users.schema.ts
│   │       ├── roles.schema.ts
│   │       ├── permissions.schema.ts
│   │       ├── customers.schema.ts
│   │       ├── ports.schema.ts
│   │       ├── agents.schema.ts
│   │       ├── warehouse-receipts.schema.ts
│   │       ├── cargo.schema.ts
│   │       ├── house-bills.schema.ts
│   │       ├── containers.schema.ts
│   │       ├── vessels.schema.ts
│   │       ├── voyages.schema.ts
│   │       ├── consolidations.schema.ts
│   │       ├── bills-of-lading.schema.ts
│   │       ├── manifests.schema.ts
│   │       ├── shipments.schema.ts
│   │       ├── documents.schema.ts
│   │       ├── tracking.schema.ts
│   │       ├── audit-logs.schema.ts
│   │       └── settings.schema.ts
│   │
│   ├── plugins/
│   │   ├── cors.plugin.ts              # Configurable CORS handling
│   │   ├── jwt.plugin.ts               # Fastify JWT integration
│   │   ├── db.plugin.ts                # Database injection & pool lifecycle
│   │   └── error-handler.plugin.ts     # Centralized, sanitized error response handling
│   │
│   ├── common/
│   │   ├── errors/                     # AppError, ValidationError, NotFoundError
│   │   ├── utils/                      # Pure math (CFT, CBM, LBS/KG), pagination, response helpers
│   │   ├── types/                      # JWT payloads, Fastify module declarations
│   │   └── constants/                  # System roles, statuses, Caribbean port definitions
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts          # JWT token verification
│   │   ├── role.middleware.ts          # Role-based access control (RBAC)
│   │   └── port-isolation.middleware.ts# Destination port data isolation for agents
│   │
│   ├── modules/                        # Business modules (Controller, Service, Repository, Routes, Schema, Types)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── customers/
│   │   ├── ports/
│   │   ├── agents/
│   │   ├── warehouse/
│   │   ├── cargo/
│   │   ├── house-bills/
│   │   ├── consolidation/
│   │   ├── containers/
│   │   ├── vessels/
│   │   ├── voyages/
│   │   ├── shipments/
│   │   ├── bills-of-lading/
│   │   ├── manifests/
│   │   ├── documents/
│   │   ├── tracking/
│   │   ├── audit/
│   │   └── settings/
│   │
│   └── routes/
│       ├── index.ts                    # Versioned route aggregator (/api/v1)
│       └── health.routes.ts            # Liveness and PostgreSQL readiness probes
│
├── drizzle/
│   └── migrations/                     # Generated SQL migrations
├── tests/
│   ├── unit/                           # Pure calculation & logic tests
│   └── integration/                    # Endpoint & workflow tests
├── .env.example
├── .gitignore
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:

```ini
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vi_customs_logistics

# JWT Secret (minimum 16 characters, 32+ recommended)
JWT_SECRET=vi_customs_super_secure_jwt_secret_key_production_grade_2026

# Allowed Frontend Origins (CORS)
CORS_ORIGIN=http://localhost:5173
```

All environment variables are strictly validated by Zod at startup (`src/config/env.ts`). The application will immediately exit with detailed error messages if any variable is invalid or missing.

---

## 5. PostgreSQL Setup

Ensure PostgreSQL is running locally on port `5432` or specify your remote database URL in `.env`.

To create the database:
```sql
CREATE DATABASE vi_customs_logistics;
```

---

## 6. Installation

From the `backend/` directory:

```bash
npm install
```

---

## 7. Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts development server with live reload via `tsx` on `http://localhost:5000` |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm start` | Runs the compiled production server |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `node --test tests/unit/calculations.test.ts` | Runs pure calculation unit tests |

---

## 8. Database Migration Commands

| Command | Description |
|---|---|
| `npm run db:generate` | Inspects Drizzle schemas and generates SQL migrations in `drizzle/migrations/` |
| `npm run db:migrate` | Runs pending migrations against PostgreSQL |
| `npm run db:push` | Pushes schema changes directly (safe dev prototyping) |
| `npm run db:studio` | Launches Drizzle Studio GUI for visual database inspection |

---

## 9. Seed Commands

Populates safe initial roles, Caribbean port records, Nassau port agent, system settings, and development users with hashed passwords:

```bash
npm run db:seed
```

### Pre-seeded Development Personas (3 Core Roles)

| Name | Role | Email | Password |
|---|---|---|---|
| Marcus Vance | `super_admin` | `marcus.vance@vicustoms.com` | `password123` |
| Carlos Mendez | `warehouse` | `carlos.m@vicustoms.com` | `password123` |
| Destination Agent Staff | `agent` | `agent@vicustoms.com` | `password123` |

---

## 10. Health Check Endpoints

- **Server Liveness:** `GET /health` or `GET /api/v1/health`
  ```json
  {
    "success": true,
    "message": "VI Customs Brokers & Logistics API is running",
    "timestamp": "2026-10-01T10:00:00.000Z",
    "version": "1.0.0"
  }
  ```

- **PostgreSQL Connectivity:** `GET /health/db` or `GET /api/v1/health/db`
  ```json
  {
    "success": true,
    "message": "PostgreSQL database connected and healthy",
    "database": "connected",
    "timestamp": "2026-10-01T10:00:00.000Z"
  }
  ```

---

## 11. API Structure & Versioning

All business endpoints are versioned under `/api/v1`:

- **Auth:**
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
- **Users:** `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id`
- **Customers:** `GET /api/v1/customers`, `POST /api/v1/customers`, `PATCH /api/v1/customers/:id`
- **Warehouse Receipts:** `GET /api/v1/warehouse-receipts`, `POST /api/v1/warehouse-receipts`
- **Cargo:** `GET /api/v1/cargo`
- **House Bills:** `GET /api/v1/house-bills`, `POST /api/v1/house-bills`
- **Consolidations:** `GET /api/v1/consolidations`
- **Containers:** `GET /api/v1/containers`
- **Bills of Lading:**
  - `GET /api/v1/bills-of-lading`
  - `POST /api/v1/bills-of-lading/:id/hold`
  - `POST /api/v1/bills-of-lading/:id/release`
- **Shipment Tracking:** `GET /api/v1/tracking/:trackingNumber`
- **Settings:** `GET /api/v1/settings`
- **Audit Logs:** `GET /api/v1/audit`

---

## 12. Architecture Rules

1. **Separation of Concerns:**
   - `Controller`: Fastify HTTP request/response validation only.
   - `Service`: Business logic, state transitions, calculation orchestration.
   - `Repository`: Direct Drizzle ORM database access.
   - `Schema`: Request & query Zod definitions.
2. **Numeric WR Identification:**
   - Warehouse Receipt primary keys are UUIDs (`id`).
   - Business receipts use numeric sequence numbers starting from **3100** (`receiptNumber`, `sequenceNumber`).
3. **Multi-Tenant Port Isolation:**
   - Destination Port Agents are restricted to their assigned destination port via `port-isolation.middleware.ts`.
4. **Hold/Release Security:**
   - B/L Hold placement and release are strictly restricted to `super_admin` and `documentation` roles.
5. **Sanitized Error Responses:**
   - Production errors never leak SQL queries, stack traces, or credentials.

---

## 13. Pending Schema Decisions

1. **Package Dimension Units:** Current frontend mock data assumes inches for length/width/height and pounds for weight (`cft = (L*W*H*pieces)/1728`). If metric unit intake (cm/kg) is introduced in later phases, an intake unit discriminator column will be added.
2. **Sequential HBL Numbers:** Currently seeded as `HBL-2026-XXXX`. A configurable sequence table or PostgreSQL sequence may be designated for zero-collision concurrency.
3. **Agent User Assignment:** Currently 1 user maps to 1 agent profile (`agentId`). Future requirements will clarify if multiple login users can belong to the same Port Agency organization.
