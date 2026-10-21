# VI Customs Brokers & Logistics — API Map & Endpoints Catalog

> **Version:** 1.0.0  
> **Base URL:** `http://127.0.0.1:5000/api/v1`  
> **Server Engine:** Fastify 5.x + TypeScript  
> **Security:** JWT Bearer Token (`Authorization: Bearer <token>`)  
> **Database:** PostgreSQL 18 via Drizzle ORM  

---

## 📑 Module Index

1. [Authentication (`/auth`)](#1-authentication-auth)
2. [User Management (`/users`)](#2-user-management-users)
3. [Customer Profiles (`/customers`)](#3-customer-profiles-customers)
4. [Master Ports (`/ports`)](#4-master-ports-ports)
5. [Port Agents (`/agents`)](#5-port-agents-agents)
6. [Warehouse Receipts (`/warehouse-receipts`)](#6-warehouse-receipts-warehouse-receipts)
7. [Cargo Staging (`/cargo`)](#7-cargo-staging-cargo)
8. [House Bills of Lading (`/house-bills`)](#8-house-bills-of-lading-house-bills)
9. [Cargo Consolidations (`/consolidations`)](#9-cargo-consolidations-consolidations)
10. [Container Fleet (`/containers`)](#10-container-fleet-containers)
11. [Vessels & Voyages (`/vessels`, `/voyages`)](#11-vessels--voyages-vessels-voyages)
12. [Master Shipments (`/shipments`)](#12-master-shipments-shipments)
13. [Master Bills of Lading (`/bills-of-lading`)](#13-master-bills-of-lading-bills-of-lading)
14. [Customs Manifests (`/manifests`)](#14-customs-manifests-manifests)
15. [Shipment Tracking & Milestones (`/tracking`)](#15-shipment-tracking--milestones-tracking)
16. [Document Vault (`/documents`)](#16-document-vault-documents)
17. [Audit Trails (`/audit`)](#17-audit-trails-audit)
18. [System Configuration & Numbering (`/settings`)](#18-system-configuration--numbering-settings)

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticates credentials and returns JWT token + user profile |
| `GET` | `/auth/me` | All Authenticated | Returns current authenticated user and role permissions |
| `POST` | `/auth/logout` | All Authenticated | Revokes session / client token |

#### `POST /auth/login` Payload:
```json
{
  "email": "carlos.m@vicustoms.com",
  "password": "<STAFF_PASSWORD>"
}
```
#### Response (`200 OK`):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e77314ef-c40e-4f1d-9106-3dd384c26271",
    "userCode": "USR-003",
    "name": "Carlos Mendez",
    "email": "carlos.m@vicustoms.com",
    "roleKey": "operations",
    "department": "Miami CFS Warehouse",
    "status": "Active"
  }
}
```

---

## 2. User Management (`/users`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | `super_admin` | Lists all system users with role keys |
| `GET` | `/users/:id` | `super_admin` | Retrieves individual user profile |
| `POST` | `/users` | `super_admin` | Creates new user with hashed password |
| `PATCH` | `/users/:id` | `super_admin` | Updates status, department, role, or contact |
| `DELETE` | `/users/:id` | `super_admin` | Deactivates or removes user account |

---

## 3. Customer Profiles (`/customers`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/customers` | All Roles | Lists all master customer profiles (shippers & consignees) |
| `GET` | `/customers/:id` | All Roles | Gets customer details, tax ID, and default destination port |
| `POST` | `/customers` | `super_admin`, `operations`, `documentation` | Creates new customer record |
| `PATCH` | `/customers/:id` | `super_admin`, `operations`, `documentation` | Updates address, credit terms, notes |
| `DELETE` | `/customers/:id` | `super_admin` | Removes customer profile |

#### `POST /customers` Payload:
```json
{
  "name": "Atlantic Trading Co.",
  "companyName": "Atlantic Trading Co.",
  "contactPerson": "Marcus Vance",
  "email": "orders@atlantictradingbahamas.com",
  "phone": "+1 (242) 555-0144",
  "address": "Bay Street Commercial Centre, Suite 300, Nassau, Bahamas",
  "destinationPort": "NAS - Nassau, Bahamas",
  "destinationCode": "NAS",
  "taxId": "TIN-BS-994821",
  "accountType": "Commercial Customer",
  "creditTerms": "Net 30"
}
```

---

## 4. Master Ports (`/ports`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/ports` | Public / All | Fetches 11 master Caribbean & Florida ports |
| `GET` | `/ports/:code` | All | Gets specific port terminal information (e.g. `NAS`) |

---

## 5. Port Agents (`/agents`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/agents` | `super_admin`, `documentation`, `agent` | Lists destination port agency accounts |
| `GET` | `/agents/:id` | `super_admin`, `agent` | Gets agency profile, credit limits, assigned shipments |
| `POST` | `/agents` | `super_admin` | Registers new destination port agency |
| `PATCH` | `/agents/:id` | `super_admin` | Updates agency credit limit, territory, or contact |

---

## 6. Warehouse Receipts (`/warehouse-receipts`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/warehouse-receipts` | All Roles | Lists all warehouse receipts with pagination/filters |
| `GET` | `/warehouse-receipts/:id` | All Roles | Gets receipt with individual package rows & calculations |
| `POST` | `/warehouse-receipts` | `operations`, `super_admin` | Creates new WR with package math & auto-numbers (`WR-2026-XXXX`) |
| `PATCH` | `/warehouse-receipts/:id` | `operations`, `super_admin` | Edits receipt details before consolidation |
| `DELETE` | `/warehouse-receipts/:id` | `super_admin` | Cancels warehouse receipt |

#### `POST /warehouse-receipts` Payload:
```json
{
  "customerId": "UUID",
  "customerName": "Atlantic Trading Co.",
  "shipper": "Global Retail Suppliers Inc, Miami, FL",
  "consignee": "Atlantic Trading Co, Nassau, Bahamas",
  "destinationPort": "NAS - Nassau, Bahamas",
  "destinationCode": "NAS",
  "cargoDescription": "Commercial Kitchen Appliances",
  "packages": [
    {
      "packageType": "Carton",
      "description": "Range Burners & Ovens",
      "pieces": 8,
      "lengthInches": 42,
      "widthInches": 38,
      "heightInches": 48,
      "weightLbs": 1200
    }
  ]
}
```

---

## 7. Cargo Staging (`/cargo`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/cargo` | All Roles | Lists individual cargo items staged in warehouse bays |
| `GET` | `/cargo/:id` | All Roles | Gets cargo dimensions, barcode, staging location |
| `PATCH` | `/cargo/:id/location` | `operations`, `super_admin` | Moves cargo to different warehouse bay |

---

## 8. House Bills of Lading (`/house-bills`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/house-bills` | All Roles | Lists all issued House B/Ls (`HBL-2026-XXXX`) |
| `GET` | `/house-bills/:id` | All Roles | Gets full printable HBL with linked WR line items |
| `POST` | `/house-bills` | `documentation`, `super_admin` | Issues HBL combining 1 or more WRs (zero data re-entry) |
| `PATCH` | `/house-bills/:id` | `documentation`, `super_admin` | Updates freight charges, terms, or notify party |

#### `POST /house-bills` Payload:
```json
{
  "customerId": "UUID",
  "customerName": "Atlantic Trading Co.",
  "warehouseReceiptIds": ["WR-UUID-1", "WR-UUID-2"],
  "destinationPort": "NAS - Nassau, Bahamas",
  "destinationCode": "NAS",
  "freightTerms": "Prepaid",
  "totalDeclaredValueUsd": 18500.00
}
```

---

## 9. Cargo Consolidations (`/consolidations`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/consolidations` | All Roles | Lists container consolidation runs |
| `GET` | `/consolidations/:id` | All Roles | Gets container pack plan, linked HBLs, capacity fill % |
| `POST` | `/consolidations` | `super_admin`, `operations` | Creates consolidation run, packs HBLs, links container |
| `POST` | `/consolidations/:id/finalize` | `super_admin` | Finalizes consolidation, triggers auto-generation of MBL & Shipment |

---

## 10. Container Fleet (`/containers`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/containers` | All Roles | Lists 20'GP, 40'GP, 40'HC container inventory |
| `GET` | `/containers/:id` | All Roles | Gets container payload capacity, tare weight, active shipment |
| `POST` | `/containers` | `operations`, `super_admin` | Adds new container unit to fleet |
| `PATCH` | `/containers/:id` | `operations`, `super_admin` | Updates seal number, location, status |

---

## 11. Vessels & Voyages (`/vessels`, `/voyages`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/vessels` | All Roles | Lists ocean carriers and feeder container vessels |
| `GET` | `/voyages` | All Roles | Lists scheduled voyages with ETD and ETA dates |
| `POST` | `/voyages` | `super_admin`, `documentation` | Schedules a new voyage route |

---

## 12. Master Shipments (`/shipments`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/shipments` | All Roles | Lists all master ocean shipments |
| `GET` | `/shipments/:id` | All Roles | Gets master shipment tracking checkpoints & linked MBL |
| `POST` | `/shipments` | `super_admin`, `operations` | Creates or confirms ocean shipment |
| `PATCH` | `/shipments/:id/status` | `super_admin`, `operations`, `agent` | Advances milestone (Booked -> Received -> Consolidated -> In Transit -> Arrived -> Delivered) |

---

## 13. Master Bills of Lading (`/bills-of-lading`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/bills-of-lading` | All Roles | Lists all Master B/Ls (`BL-VI-2026-XXXX`) |
| `GET` | `/bills-of-lading/:id` | All Roles | Gets printable Master Ocean B/L with hold status |
| `POST` | `/bills-of-lading/:id/hold` | `super_admin`, `documentation` | **Places Master B/L On Hold** (Payment Pending, Customs Hold) |
| `POST` | `/bills-of-lading/:id/release` | `super_admin` | **Clears Hold & Releases B/L** for destination cargo handover |

#### `POST /bills-of-lading/:id/hold` Payload:
```json
{
  "reason": "Payment Pending: Freight & Documentation Charges Unsettled",
  "holdType": "Financial",
  "notes": "Hold until wire confirmation is received from consignee bank."
}
```

---

## 14. Customs Manifests (`/manifests`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/manifests` | All Roles | Lists generated outward/inward ocean manifests |
| `GET` | `/manifests/:id` | All Roles | Gets manifest line items categorized by HBL |
| `POST` | `/manifests/generate` | `documentation`, `super_admin` | Generates manifest for voyage/shipment |
| `GET` | `/manifests/:id/export?format=csv` | `documentation`, `super_admin`, `agent` | Exports Customs-compliant CSV format |
| `GET` | `/manifests/:id/export?format=xml` | `documentation`, `super_admin`, `agent` | Exports Customs-compliant XML format |

---

## 15. Shipment Tracking & Milestones (`/tracking`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/tracking/:query` | Public / All | Unified lookup by Tracking # (`TRK-...`), B/L # (`BL-...`), or WR # (`WR-...`) |

#### Response (`200 OK`):
```json
{
  "type": "shipment",
  "trackingNumber": "TRK-VI-994821",
  "status": "In Transit",
  "origin": "Port of Miami (USMIA)",
  "destination": "Port of Kingston (JMKIN)",
  "vessel": "MV Caribbean Carrier (V.2026-18W)",
  "blStatus": "Released",
  "eta": "2026-09-02",
  "checkpoints": [
    { "stage": "Cargo Received CFS", "status": "Completed", "date": "2026-08-27" },
    { "stage": "Container Stuffed & Sealed", "status": "Completed", "date": "2026-08-28" },
    { "stage": "Vessel Departed Origin", "status": "Active", "date": "2026-08-29" },
    { "stage": "Vessel Arrival Destination", "status": "Pending", "date": "2026-09-02" }
  ]
}
```

---

## 16. Document Vault (`/documents`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/documents` | All Roles | Lists uploaded customs invoices, packing lists, permits |
| `POST` | `/documents/upload` | All Roles | Uploads commercial PDF attachments |
| `GET` | `/documents/:id/download` | Check Hold Logic | Downloads document (restricted if parent B/L is On Hold) |

---

## 17. Audit Trails (`/audit`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/audit` | `super_admin` | Returns immutable audit log of all system actions (Hold placed, WR created, B/L released) |

---

## 18. System Configuration & Numbering (`/settings`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/settings` | All Roles | Returns company profile, tax IDs, FMC license #, and numbering prefix rules |
| `PUT` | `/settings/numberingRules` | `super_admin` | Updates prefix strings (`WR-2026-`, `BL-VI-2026-`, etc.) |
