# VI Customs Brokers & Logistics — Frontend Application

Modern React + Vite frontend for **VI Customs Brokers & Logistics** freight forwarding and cargo consolidation platform.

---

## 1. Overview & Business Model

* **Business:** NVOCC / Freight Forwarding Agent (Miami CFS ➔ Eastern Caribbean)
* **Core Workflow:**
  1. **1. Warehouse Receipts:** Dock intake, customer creation, package dimensions & weight, barcode thermal labels.
  2. **2. House Bills of Lading:** Customer cargo bills ready for consolidation.
  3. **3. Master Bills & Manifests:** Container & vessel assignment, full-page ocean B/L print, 1-click ocean manifest generation.
* **Agent Portal:** Dedicated destination port portal for inbound vessels, cargo volume (CBM/CFT), and document inspection.

---

## 2. Technology Stack

* **Framework:** React 18
* **Build Tool:** Vite 6 / 8
* **Styling:** Vanilla CSS design system with responsive layouts
* **Icons:** `lucide-react`
* **API Client:** Fetch client with automatic JWT bearer authorization and token refresh
* **Backend Connection:** Proxies `/api/v1` to Fastify backend on `http://127.0.0.1:5001`

---

## 3. Running Locally

### Prerequisites
* Node.js v20+
* Fastify Backend running on port `5001`
* PostgreSQL running with `wereHouseDb`

### Commands
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
# Accessible at: http://localhost:5173

# Production build
npm run build
```

---

## 4. User Roles & Login Credentials

| Role | User Name | Email | Password | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Marcus Vance | `marcus.vance@vicustoms.com` | `password123` | Full access, settings, RBAC, holds & releases |
| **Warehouse** | Carlos Mendez | `carlos.m@vicustoms.com` | `password123` | Dock intake, WRs (starting 3100), HBLs (No Delete) |
| **Agent** | Destination Agent Staff | `agent@vicustoms.com` | `password123` | Master B/Ls, Manifests, Inbound Volume (Read-Only) |
