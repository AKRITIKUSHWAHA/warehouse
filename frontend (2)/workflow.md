# 🚢 VI CUSTOMS BROKERS & LOGISTICS — MASTER E2E WORKFLOW MANUAL
> **Authoritative System Workflow & Operations Guide**  
> *Target System: Freight Forwarding, Cargo Consolidation & Port Clearance*  
> *Service Region: Eastern Caribbean (Miami CFS ➔ Anguilla, Tortola, St. Kitts, St. Maarten, etc.)*  

---

## 🏛️ System Architecture: The 3-Step Cargo Workflow

The application implements a streamlined, zero-redundancy **3-Step Cargo Workflow** designed for NVOCC freight operations:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: WAREHOUSE INTAKE (Carlos Mendez / Warehouse Staff)                       │
│   • Customer Profiles lookup / creation (works as Shipper or Consignee)          │
│   • Cargo receiving & package-level intake (L × W × H in inches, gross lbs)      │
│   • Live Math: CFT = (L×W×H)/1728, CBM = CFT / 35.3147                           │
│   • Numeric receipt sequence starting at 3100 (e.g. WR-2026-3101)                │
│   • 4" × 6" Thermal Cargo Label generation with Barcode / QR                     │
│   • Role restriction: Delete action prohibited                                   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: HOUSE BILLS OF LADING (Customer Consignment Documentation)               │
│   • Multi-select received warehouse cargo items                                  │
│   • Direct generation of House Bills of Lading (HBL-2026-XXXX)                   │
│   • Shipper, Consignee, Destination Port, and Weight pre-filled with zero re-entry│
│   • Ready for container consolidation                                            │
│   • Role restriction: Delete action prohibited for Warehouse & Agent             │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: MASTER BILLS OF LADING & OCEAN MANIFESTS                                 │
│   • Leased Ocean Container # (e.g., MSKU-829104-5) and Bolt Seal # binding       │
│   • Ocean Feeder Vessel (e.g., M/V Caribbean Carrier) and Carrier binding        │
│   • Master Ocean Bill of Lading (BL-VI-2026-XXXX) with auto-aggregated totals    │
│   • 1-Click Ocean Cargo Manifest Generation (MNF-2026-XXXX)                      │
│   • Full-Page Standard Ocean B/L print template (100% full-width Letter/A4)      │
│   • Hold Governance: Super Admin can place B/L On Hold or Release for handover   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ DESTINATION AGENT PORTAL (Destination Agent Staff / Port Agent)                  │
│   • Live Agent Dashboard with Incoming Ships, Ready Documents, and Cargo Volume  │
│   • Real-time CBM & CFT volume tracking (e.g. 0.01 CBM / 0.40 CFT, 2 pkgs)       │
│   • Inbound Consignment Table displaying Vessel, Container, Seal, and ETA        │
│   • Direct B/L Access for destination clearance and cargo handover               │
│   • Role restriction: Read-only access (no edit, delete, or export of manifests) │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Active Operational Personas & Credentials

| Role Key | Persona Name | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | Marcus Vance | `marcus.vance@vicustoms.com` | `password123` | Global HQ Console, Full Delete & Edit Permissions, Security Holds & Releases, User Management. |
| **`warehouse`** | Carlos Mendez | `carlos.m@vicustoms.com` | `password123` | Miami CFS Dock Intake, Customer Creation, WRs (starting 3100), Labels, Drafting HBLs. **No Delete**. |
| **`agent`** | Destination Agent Staff | `agent@vicustoms.com` | `password123` | Destination Port Operations, Inbound Vessels, Cargo Volume Inspection, Accessing Master B/Ls & Manifests. **Read-Only**. |

---

## 🟢 STEP-BY-STEP OPERATIONAL GUIDE

### 1. Step 1: Receiving Cargo at Miami Dock (`1. Warehouse Receipts`)
1. Sign in as **Carlos Mendez** (`warehouse`).
2. Go to **`1. Warehouse Receipts`** ➔ Click **`+ New Receipt`**.
3. Select or create the customer (acts as Shipper or Consignee).
4. Enter package count, gross weight (lbs), and dimensions (L × W × H in inches).
5. The system calculates **CFT** and **CBM** dynamically.
6. Click **`Save Receipt`**. Receipt `WR-2026-3101` is issued.
7. Click **`Print Label`** to output the thermal barcode label.

### 2. Step 2: Preparing House Bills (`2. House Bills of Lading`)
1. Navigate to **`2. House Bills of Lading`**.
2. Select the staged warehouse cargo.
3. Click **`Issue House Bill`**.
4. Confirm destination port and consignee.
5. Save the bill (`HBL-2026-XXXX`).

### 3. Step 3: Master B/L Consolidation & Outward Manifest (`3. Master Bills & Manifests`)
1. Navigate to **`3. Master Bills & Manifests`**.
2. Open or create the Master Ocean Bill of Lading (`BL-VI-2026-XXXX`):
   - Select Vessel (*M/V Caribbean Carrier*) and Carrier (*Tropical Shipping*).
   - Enter Container (*MSKU-829104-5*) and Seal (*SEAL-VI-8821*).
   - Select the House Bills. Totals aggregate automatically.
3. Click **`Generate Manifest`** (1-Click Manifest) to generate `MNF-2026-XXXX`.
4. Click **`Print Master B/L`** to render the standard full-page ocean shipping bill.

### 4. Destination Agent Verification (`Agent Portal`)
1. Sign in as **Destination Agent Staff** (`agent`).
2. The **Agent Dashboard** displays:
   - **Incoming Ships:** Active inbound arrivals.
   - **Cargo Volume:** Live CBM (e.g. `0.01 CBM`) and CFT (`0.40 CFT`).
   - **Inbound Consignments Table:** Shows `BL-VI-2026-646` with vessel, container, seal, volume, and **B/L Access** button.
3. Click **`B/L Access`** to inspect the Master B/L and verify hold release status.