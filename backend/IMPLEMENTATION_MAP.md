# VI Customs Brokers & Logistics — Fastify Backend Implementation Map

> **Architecture Style:** Modular Domain-Driven Layered Architecture  
> **Server Framework:** Fastify 5.x (TypeScript)  
> **Database Layer:** Drizzle ORM over PostgreSQL `pg.Pool`  
> **Location:** `e:\KiyaanProject\WereHousePRoject\backend`  

---

## 🏛️ System Architecture Diagram

```text
                  Incoming HTTP Request
                            │
                            ▼
              ┌───────────────────────────┐
              │     Fastify Web Server    │
              │       (src/server.ts)     │
              └─────────────┬─────────────┘
                            │
               ┌────────────▼────────────┐
               │    Fastify Plugins      │
               │  - CORS (cors.plugin)   │
               │  - JWT (jwt.plugin)     │
               │  - DB (db.plugin)       │
               │  - Error Handler Plugin │
               └────────────┬────────────┘
                            │
               ┌────────────▼────────────┐
               │   API Route Router      │
               │   (/api/v1/* prefixes)  │
               └────────────┬────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
      [Auth Module]   [Warehouse Mod]  [Consolidation] ... (19 Modules)
            │               │               │
            ▼               ▼               ▼
       Controllers ──►   Services   ──►  Drizzle ORM
                                                │
                                                ▼
                                         PostgreSQL DB
                                         (wereHouseDb)
```

---

## 📂 Source Code Directory Structure

```text
backend/
├── .env                              # Active environment configuration
├── .env.example                      # Configuration template
├── drizzle.config.ts                 # Drizzle schema & migration settings
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript compilation config
├── drizzle/
│   └── migrations/
│       └── 0000_lethal_mach_iv.sql   # Complete PostgreSQL DDL (20 tables)
└── src/
    ├── app.ts                        # Fastify instance builder & plugin assembly
    ├── server.ts                     # Process bootstrap & port binding (5000)
    ├── config/
    │   ├── constants.js              # Application global constants
    │   └── env.ts                    # Zod-validated environment parser
    ├── plugins/
    │   ├── cors.plugin.ts            # Cross-Origin Resource Sharing setup
    │   ├── db.plugin.ts              # PostgreSQL connection lifecycle
    │   ├── error-handler.plugin.ts   # Centralized error formatter
    │   └── jwt.plugin.ts             # JWT authentication middleware
    ├── db/
    │   ├── client.ts                 # Drizzle instance initialized with pg.Pool
    │   ├── index.ts                  # Database exports & connection tester
    │   ├── migrate.ts                # Drizzle migration runner script
    │   ├── seed.ts                   # Master roles, ports, settings & users seeder
    │   └── schema/                   # 20 Drizzle schema definitions
    │       ├── agents.schema.ts
    │       ├── audit-logs.schema.ts
    │       ├── bills-of-lading.schema.ts
    │       ├── cargo.schema.ts
    │       ├── consolidations.schema.ts
    │       ├── containers.schema.ts
    │       ├── customers.schema.ts
    │       ├── documents.schema.ts
    │       ├── house-bills.schema.ts
    │       ├── manifests.schema.ts
    │       ├── permissions.schema.ts
    │       ├── ports.schema.ts
    │       ├── roles.schema.ts
    │       ├── settings.schema.ts
    │       ├── shipments.schema.ts
    │       ├── tracking.schema.ts
    │       ├── users.schema.ts
    │       ├── vessels.schema.ts
    │       ├── voyages.schema.ts
    │       └── warehouse-receipts.schema.ts
    ├── routes/
    │   ├── index.ts                  # Central route registry under /api/v1
    │   └── health.routes.ts          # /health & /health/db endpoints
    └── modules/                      # 19 Functional Domain Modules
        ├── agents/
        ├── audit/
        ├── auth/
        ├── bills-of-lading/
        ├── cargo/
        ├── consolidation/
        ├── containers/
        ├── customers/
        ├── documents/
        ├── house-bills/
        ├── manifests/
        ├── ports/
        ├── settings/
        ├── shipments/
        ├── tracking/
        ├── users/
        ├── vessels/
        ├── voyages/
        └── warehouse/
```

---

## 🧩 Standard Module Structure

Every business domain module under `src/modules/<module-name>/` follows a standardized 4-part pattern:

1. **`<module>.schema.ts`**  
   Exports the Drizzle ORM table definition, column types, foreign keys, indexes, and TypeScript inferred types (`Select<T>`, `Insert<T>`).

2. **`<module>.dto.ts`**  
   Input validation schemas for POST request bodies, PATCH updates, and URL query filters.

3. **`<module>.service.ts`**  
   Encapsulates all business logic, live math calculations (CFT/CBM), state transitions, transactions, and database queries.

4. **`<module>.controller.ts` & `<module>.routes.ts`**  
   Registers Fastify route endpoints, attaches authentication hooks (`onRequest: [app.authenticate]`), executes controller methods, and maps HTTP responses.

---

## 🛡️ Error Handling Architecture

All runtime exceptions and validation errors are intercepted by `registerErrorHandlerPlugin` (`src/plugins/error-handler.plugin.ts`), producing consistent JSON error envelopes:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Package width, length, and height must be positive numbers greater than zero",
  "timestamp": "2026-10-01T11:00:00.000Z"
}
```

### Standard Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created (WR, HBL, Shipment, Consolidation).
- `400 Bad Request`: Input payload validation failure.
- `401 Unauthorized`: Missing or invalid JWT Bearer token.
- `403 Forbidden`: User role lacks permission for the action (e.g. Agent attempting to place Hold).
- `404 Not Found`: Entity with specified ID does not exist.
- `409 Conflict`: Unique constraint violation (duplicate customer number, container code).
- `500 Internal Server Error`: Unhandled database or operational error.

---

## ⚙️ Environment Variables Reference (`.env`)

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | HTTP listening port |
| `HOST` | `0.0.0.0` | Network interface binding |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `DATABASE_URL` | `postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>` | PostgreSQL connection string |
| `JWT_SECRET` | `<JWT_SECRET_KEY>` | HMAC SHA256 key for signing auth tokens |
| `CORS_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
