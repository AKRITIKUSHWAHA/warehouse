# 🚢 KERS / VI CUSTOMS & LOGISTICS — MASTER E2E WORKFLOW MANUAL
> **Authoritative System Workflow & Testing Guide**  
> *Last Updated & Code-Synchronized: October 2026*  
> *Target System: Freight Forwarding, Cargo Consolidation & Port Clearance*

---

## 🏛️ System Architecture Overview: 5-Stage Persona Flow

The application implements a strict **5-Role Enterprise Separation of Concerns**:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: CARLOS MENDEZ (Warehouse Staff / CFS Intake)                            │
│   • Customer Profiles lookup / creation                                          │
│   • Cargo receiving & package-level intake (L × W × H, gross lbs)                 │
│   • Live Math: CFT = (L×W×H)/1728, CBM = CFT × 0.0283168                         │
│   • 4" × 6" Roll Thermal Label generation (Piece 1 of N, Code 128 & QR)          │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: ELENA ROSTOVA (Operations Coordinator / Consolidation Hub)              │
│   • Review staged cargo inventory ready by destination (e.g., Nassau - NAS)      │
│   • 4-Step Consolidation Wizard: Multi-select WRs / House B/Ls                   │
│   • Real-time Container Space Utilization Meter (20' GP, 40' GP, 40' HC)         │
│   • Ocean Vessel, Voyage #, Container #, and Bolt Seal # binding                 │
│   • Auto-generates Master Ocean Shipment & Draft Master B/L (BL-VI-2026-XXXX)    │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: SARAH JENKINS (Documentation Specialist / Maritime Desk)                │
│   • House Bill of Lading (HBL) issue with zero data re-entry                      │
│   • Master Bill of Lading (MBL) review & tariff/billing verification             │
│   • Security Hold Governance: Place B/L On Hold ◄──► Clear Hold & Release        │
│   • Customs Ocean Manifests: Portrait / Landscape print & CSV / XML exports      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: DAVID CARTWRIGHT (Destination Agent / Nassau Hub)                       │
│   • Dedicated Port Agent Portal (scoped strictly to Bahamas arrivals)            │
│   • Inspection of incoming ocean containers & ETA milestones                     │
│   • Strict Hold Lock: ON HOLD documents locked with red violation banner         │
│   • RELEASED B/L inspection, cargo manifest verification & delivery orders       │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: MARCUS VANCE (Super Admin / Global Operations HQ)                       │
│   • Unrestricted system-wide command & monitoring                                │
│   • Reactive System Audit Trail (Timestamp, IP, User, Module, Action)            │
│   • Dynamic RBAC Users & Roles Matrix governance                                 │
│   • System Configuration: Sequence numbering, branding, ports & island hubs      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🟢 STAGE 1: Cargo Receiving ➔ 📦 WAREHOUSE (Carlos Mendez)

### 1.1 How to Sign In:
* Click the **Warehouse** quick-select button on the login screen (or click *Sign In →* on Carlos Mendez's persona card).
* **Credentials:** `carlos.m@vicustoms.com` / `<PASSWORD>`
* **Role Badge:** `📦 CFS Warehouse Intake`

### 1.2 Landing Page & Scoped Navigation:
* **Landing Page:** Opens directly into the **CFS Dashboard** with intake queues and quick-action cards.
* **Navigation Scoping:** Carlos's sidebar is strictly scoped to physical intake operations:
  * `CFS Dashboard`
  * `Warehouse Receipts (WR)`
  * `Cargo Inventory`
  * `Labels & 4x6 Roll`
  * `Customer Profiles`
  * `Cargo Tracking`

### 1.3 Primary Call to Action:
* **Top Header Button:** `+ Create Warehouse Receipt` (or `+ Intake WR` on the list page).

### 1.4 Step-by-Step Intake Execution:
1. **Physical Cargo Arrival:** Freight arrives at the dock via delivery truck.
2. Carlos clicks **`+ Create Warehouse Receipt`**:
   * **Customer Selection:** Select customer from dropdown (e.g. *Atlantic Trading Co.* or *Tropical Food Distributors*).
   * **Zero Re-entry:** Shipper, Consignee, and Destination Port (e.g. `NAS - Nassau, Bahamas`) auto-populate from the profile.
   * **Independent Consignee:** If consignee is different from customer, Carlos unlinks and selects the true consignee.
3. **Package Dimensions & Weight Input:**
   * Clicks **`+ Add Package Row`** to record individual crates/pallets.
   * Enters **Length, Width, Height (inches)** and **Weight (lbs)** for each package.
   * **Live Math Engine:** The interface calculates instantly:
     $$\text{CFT} = \frac{L \times W \times H}{1728}, \quad \text{CBM} = \text{CFT} \times 0.0283168$$
     $$\text{Volumetric Weight} = \frac{L \times W \times H}{166}$$
   * Summary bar updates: Total Pieces, Gross Weight, Total CFT, and Total CBM.
4. **Warehouse Bay Staging:**
   * Assigns staging location: e.g. `Bay A-02`, `Rack 3`.
5. **Save & Generate:**
   * Clicks **`Save & Generate Warehouse Receipt`**. Receipt status becomes `STAGED`.

### 1.5 Cargo Label Print (4" $\times$ 6" Thermal Roll):
1. In the created WR detail view, clicks **`Preview 4x6 Label`** or **`Print Thermal Label`**.
2. **Label Verification:**
   * Includes Header: *VI Customs & Logistics / CFS Miami Hub*
   * WR Number (numeric sequence: e.g. `3104`), Customer, Destination Port (`NAS - Nassau`)
   * Piece Count: **Piece 1 of N, Piece 2 of N...**
   * Code 128 scannable barcode representation and 2D QR Code.
3. Direct browser print triggers with CSS `@media print` optimization.
4. Carlos clicks **Logout** from bottom left.

---

## 🚢 STAGE 2: Cargo Consolidation ➔ 🌊 OPERATIONS (Elena Rostova)

### 2.1 How to Sign In:
* Click the **Operations** quick-select button on the login screen (or click *Sign In →* on Elena Rostova's card).
* **Credentials:** `elena.r@vicustoms.com` / `<PASSWORD>`
* **Role Badge:** `🚢 Operations Coordinator`

### 2.2 Landing Page & Scoped Navigation:
* **Landing Page:** **Operations Dashboard** showing active voyages, container utilization, and staged receipts.
* **Navigation Scoping:** Elena's sidebar is focused on vessel consolidation and fleet management:
  * `Operations Dashboard`
  * `Consolidations Wizard`
  * `Master Shipments`
  * `Containers Fleet`
  * `Vessels & Voyages`
  * `Cargo Staged`
  * `Bills of Lading (View)`
  * `Shipment Tracking`

### 2.3 Primary Call to Action:
* **Top Header Button:** `+ Build Consolidation` (Consolidations Wizard).

### 2.4 Step-by-Step Consolidation Execution (4-Step Wizard):
1. Elena navigates to **`Consolidations Wizard`**:
2. **Step 1 — Destination Port & Batch Selection:**
   * Selects Destination Port: `NAS - Nassau, Bahamas`.
   * The system filters and displays all un-consolidated Warehouse Receipts / HBLs staged for Nassau.
   * Elena selects multiple receipts using checkboxes (e.g. Carlos's newly intaked WRs).
3. **Step 2 — Container Utilization & Capacity Meter:**
   * Elena selects container type: `40' High Cube (40' HC)`.
   * **Live Capacity Bar:** Shows cubic space and payload utilization (e.g. `78% Volume / 62% Weight`).
   * Color changes dynamically (Green < 85%, Amber 85-98%, Red Over-capacity).
4. **Step 3 — Vessel, Voyage & Bolt Seal Assignment:**
   * **Ocean Vessel:** `MV Island Voyager`
   * **Voyage #:** `V.2026-19E`
   * **Ocean Container #:** `CMAU-109482-7`
   * **Bolt Seal #:** `SEAL-882194`
5. **Step 4 — Finalize & Generate Master Records:**
   * Elena clicks **`Create Consolidation & Generate Master Shipment`**.
   * **System State Transitions:**
     * Selected WRs and Cargo items transition to `CONSOLIDATED`.
     * New Master Ocean Shipment created (`SHP-VI-2026-0881`) with 6 milestone checkpoints.
     * Draft Master Bill of Lading created (`BL-VI-2026-0095`).
6. Elena clicks **Logout**.

---

## 📄 STAGE 3: Maritime Documentation & Security ➔ 📑 DOCUMENTATION (Sarah Jenkins)

### 3.1 How to Sign In:
* Click the **Documentation** quick-select button on the login screen (or click *Sign In →* on Sarah Jenkins's card).
* **Credentials:** `sarah.j@vicustoms.com` / `<CONFIGURED_IN_SEED_OR_ENV>`
* **Role Badge:** `📄 Documentation Specialist`

### 3.2 Landing Page & Scoped Navigation:
* **Landing Page:** **Documentation Desk** displaying pending B/Ls, hold warnings, and manifest exports.
* **Navigation Scoping:**
  * `Documentation Desk`
  * `House Bills of Lading (HBL)`
  * `Master Bills (MBL) & Holds`
  * `Ocean Manifests (CSV/XML)`
  * `Warehouse Receipts`
  * `Consolidations View`
  * `Customer Profiles`
  * `Documents & Labels`
  * `Tracking`
  * `Shipment History`

### 3.3 Primary Call to Action:
* **Top Header Buttons:** `Review B/L` and `Export Manifest`.

### 3.4 Step-by-Step Documentation Execution:
1. **House Bill of Lading (HBL) Issuance:**
   * Navigates to **`House Bills of Lading (HBL)`** $\rightarrow$ **`+ Issue House B/L`**.
   * Links Carlos's Warehouse Receipts. Customer name, cargo description, pieces, weight, and volume are inherited with zero re-entry.
   * Verifies ocean freight billing, documentation fees, and declared values.
   * Clicks **`Issue House Bill of Lading`** (`HBL-VI-2026-0142`).
2. **Master Bill of Lading (MBL) Review:**
   * Opens **`Master Bills of Lading`** $\rightarrow$ selects Elena's generated Master B/L (`BL-VI-2026-0095`).
   * Verifies Shippers, Carrier, Port of Loading (`Miami CFS Hub`), Port of Discharge (`Nassau, Bahamas`), Vessel, and Seal #.
3. **Security Hold & Release Governance:**
   * **Place Hold:** Sarah clicks **`Place B/L On Hold`** $\rightarrow$ selects reason: *"Pending Freight Payment & Export Tax Clearance"* $\rightarrow$ enters Hold Note.
   * Status changes to **`ON HOLD`** with a red security banner across all systems.
   * **Clear Hold:** Once wire transfer is verified, Sarah clicks **`Clear Hold & Release B/L`** $\rightarrow$ enters security authorization PIN $\rightarrow$ status changes to **`RELEASED`**.
4. **Customs Ocean Manifest Export:**
   * Navigates to **`Ocean Manifests (CSV/XML)`**.
   * Opens Nassau manifest: Toggles between **Portrait** and **Landscape** view.
   * Clicks **`Export CSV`** (for internal carrier filing) and **`Export Customs XML`** (for Bahamas Customs EDI).
5. Sarah clicks **Logout**.

---

## 🛡️ STAGE 4: Port Reception & Delivery Clearance ➔ 🏝️ DESTINATION AGENT (Destination Agent Staff)

### 4.1 How to Sign In:
* Click the **Destination Agent** quick-select button on the login screen.
* **Credentials:** `agent@vicustoms.com` / `<PASSWORD>`
* **Role Badge:** `🛡️ Destination Agent`

### 4.2 Landing Page & Scoped Navigation:
* **Landing Page:** Dedicated **Agent Portal** showing assigned incoming shipments.
* **Strict Regional Scoping:** David cannot see Miami warehouse internal files; he only sees Bahamas-bound shipments.
* **Navigation Items:**
  * `Agent Dashboard`
  * `My Assigned Shipments`
  * `My Consolidations`
  * `My Ocean Manifests`
  * `Documents & B/Ls`
  * `Cargo Receiving`
  * `Port Tracking`

### 4.3 Port Reception Execution:
1. **Container Arrival Inspection:**
   * David opens **`My Assigned Shipments`** $\rightarrow$ finds `MV Island Voyager / Voyage V.2026-19E`.
   * Verifies container number `CMAU-109482-7` and bolt seal `SEAL-882194` upon vessel docking at Nassau port.
2. **Strict Hold Lock Enforcement Test:**
   * If a B/L is **`ON HOLD`**, David sees a prominent red warning banner:
     *"HOLD ACTIVE: Document locked by HQ Documentation. Do NOT release cargo."*
   * Release and download buttons are completely disabled.
3. **Released Cargo Clearance:**
   * When B/L status is **`RELEASED`**, the lock disappears.
   * David downloads the certified Master B/L, issues the Port Delivery Order, and releases cargo to the consignee.
4. David clicks **Logout**.

---

## ⚡ STAGE 5: Executive Oversight & Governance ➔ 👑 SUPER ADMIN (Marcus Vance)

### 5.1 How to Sign In:
* Click the **Super Admin** quick-select button on the login screen (or click *Sign In →* on Marcus Vance's card).
* **Credentials:** `marcus.vance@vicustoms.com` / `<PASSWORD>`
* **Role Badge:** `⚡ Super Admin (Global HQ)`

### 5.2 Command Center Features:
* **Unrestricted Navigation:** Full access to all 5 roles' tools, plus administrative controls:
  * `Admin Dashboard`
  * `Users & Roles Matrix`
  * `System Audit Trail`
  * `Shipment History`
  * `System Settings`
  * *(Plus full Operations & Maritime modules)*

### 5.3 Administrative Capabilities:
1. **Users & RBAC Matrix (`/users`):**
   * View all active staff members and agents.
   * Inspect the 5-column granular permissions matrix (`Super Admin`, `Operations`, `Warehouse`, `Documentation`, `Agent`).
   * Add, edit, or decommission staff accounts.
2. **System Audit Trail (`/audit`):**
   * Real-time immutable record of every intake, WR creation, consolidation, hold trigger, hold clearance, and EDI export.
   * Includes exact timestamp, IP address, user persona, and before/after state diff.
3. **System Settings (`/settings`):**
   * Configure numbering sequences (e.g. WR starting number `3100`).
   * Update company branding, legal disclaimers, and customs EDI export parameters.

---

## 📐 Formulas & Engineering Standards Reference

### 1. Dimension & Volume Formulas:
$$\text{CFT (Inches)} = \frac{\text{Length} \times \text{Width} \times \text{Height} \times \text{Pieces}}{1728}$$
$$\text{CBM (Inches)} = \text{CFT} \times 0.0283168$$
$$\text{Volumetric Weight (lbs)} = \frac{\text{Length} \times \text{Width} \times \text{Height}}{166}$$

### 2. Label Standard:
* **Dimensions:** 4.0 inches $\times$ 6.0 inches (Roll Thermal).
* **Barcode Format:** Code 128 (scannable standard alphanumeric).
* **QR Format:** 2D QR Code with direct tracking link.

### 3. Client Requirements Notes (Kedreana - 21 Sept 2026):
* **WR Numbering:** Numeric-only sequence starting at `3100` (e.g. `3101`, `3102`).
* **Volume Display Priority:** Display CFT as primary with CBM secondary: `45.0 CFT (1.27 CBM)`.
* **Independent Consignee:** Allow consignee to differ from customer.
* **Agent Flexibility:** Destination Agent role also supports export operations where applicable.

---
*End of Master Workflow Manual. Verified and Code-Synced.*