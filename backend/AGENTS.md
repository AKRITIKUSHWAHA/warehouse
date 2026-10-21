# Antigravity Operating Rules & Project Guardrails

> **Project:** VI Customs Brokers & Logistics / KERS Freight-Forwarding  
> **Backend:** Fastify 5.x + TypeScript + PostgreSQL 18 via Drizzle ORM  
> **Frontend:** React 18 + Vite (Production styling & modular layouts)  
> **Master Roadmap:** [`backend/PROJECT_STATE_AND_ROADMAP.md`](PROJECT_STATE_AND_ROADMAP.md)  

---

## 📌 Business Scope: NVOCC Agent Model (Client-Simplification)
The platform is tailored for a small Non-Vessel Operating Common Carrier (NVOCC) agent operation:
1. **Unified Customers Master Directory:** One master customer list. The same customer profile can be selected as Shipper or Consignee across all workflow forms.
2. **Simple Fleet Directory:** Replaces complex voyage schedules with a lightweight directory of ocean vessels (Name, Type/Classification, Carrier, Notes). No voyage numbers, active voyage schedules, or operational vessel status.
3. **No Equipment Fleet Management:** Containers are sourced per shipment from VOCCs. No container inventory tracking, tare weights, payloads, capacity limits, or fill % bars. Container Number, Seal Number, and Container Type remain as plain manual text fields on Consolidation, Master B/L, and Customs Manifest.
4. **No Bahamas-Specific Hardcoding:** Ports and destinations are fully dynamic and user-managed.
5. **Full-Page Maritime Shipping Print:** Master B/L and House B/L viewers support full-page maritime document layout (@media print).

---

## ⛔ Non-Negotiable Core Rules

1. **CLEAN SLATE DATA INTEGRITY (NO DUMMY DATA):**
   - Do NOT introduce hardcoded dummy shipments, fake vessels, or mock consignment numbers.
   - The database and UI must remain a clean slate. Only real data submitted by user actions should exist.

2. **MAINTAIN ALL 5 WORKFLOW PERSONAS:**
   - Always preserve the 5 functional workflow users:
     - **Marcus Vance:** `marcus.vance@vicustoms.com` (`super_admin` — Global System Settings & Oversight)
     - **Elena Rostova:** `elena.r@vicustoms.com` (`operations` — Consolidations & Master Shipments)
     - **Sarah Jenkins:** `sarah.j@vicustoms.com` (`documentation` — House Bills, Master B/Ls, Customs Manifests)
     - **Carlos Mendez:** `carlos.m@vicustoms.com` (`warehouse` — Cargo Intake, 4x6 Thermal Labels & Warehouse Receipts)
     - **Destination Agent Staff:** `agent@vicustoms.com` (`agent` — Dedicated Destination Port Portal)
   - Password: `<CONFIGURED_IN_SEED_OR_ENV>`

3. **END-TO-END WORKFLOW INTEGRITY:**
   - $\text{Fleet Directory Vessel} \longrightarrow \text{Customer} \longrightarrow \text{Warehouse Receipt} \longrightarrow \text{House B/L} \longrightarrow \text{Consolidation} \longrightarrow \text{Master B/L} \longrightarrow \text{Manifest}$

---

## 🛠️ Environment Reference
- **Frontend URL:** `http://localhost:5173`
- **Backend API URL:** `http://127.0.0.1:5001/api/v1`
- **Database Connection:** `postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>`
- **JWT Secret:** `<CONFIGURED_IN_ENV>`
- **Build Verification:**
  - Backend: `npm run typecheck`
  - Frontend: `npm run build`
