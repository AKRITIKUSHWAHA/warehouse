# Implemented Workflows & System Architecture

## 1. 3-Step Streamlined Cargo Workflow
1. **Warehouse Receipts (Step 1):**
   - Numeric receipt sequence starting at `3100` (`WR-2026-3101`, `WR-2026-3102`).
   - Single unified Customer directory (can act as Shipper or Consignee).
   - Package-level dimensions (L × W × H) and weight with dynamic CFT & CBM calculations.
   - 4" × 6" Thermal Roll Barcode cargo labels.
   - Restricted Delete action for `warehouse` role.

2. **House Bills of Lading (Step 2):**
   - Multi-select received warehouse cargo items.
   - Direct generation of House Bills of Lading (`HBL-2026-0001`, `HBL-2026-0002`).
   - Auto pre-filled Shipper, Consignee, Destination Port, and Weight.
   - Restricted Delete action for `warehouse` and `agent` roles.

3. **Master Bills of Lading & Ocean Manifests (Step 3):**
   - Feeder vessel (*M/V Caribbean Carrier*) and carrier (*Tropical Shipping*) binding.
   - Leased ocean container (*MSKU-829104-5*) and bolt seal (*SEAL-VI-8821*) binding.
   - Multi-select consolidated House Bills with auto-aggregated pieces, weight, and volume.
   - **1-Click Manifest:** Generates outward customs manifest (`MNF-2026-0001`).
   - Standard full-page ocean shipping Bill of Lading (`BL-VI-2026-646`).
   - Super Admin Security Hold Governance (Place On Hold ◄──► Clear Hold & Release).

---

## 2. Destination Agent Portal Integration
- **Agent Dashboard:**
  - Live **Incoming Ships** counter.
  - Live **Cargo Volume** (`0.01 CBM` / `0.40 CFT`, 2 packages scheduled, Active Inbound).
  - Live **Ready Documents** counter (Master Bills + Manifests).
  - Live **My Inbound Assigned Shipments** table displaying `BL-VI-2026-646`, Vessel, Container, Seal, Volume, ETA, Status, and direct **B/L Access** button.
- **Agent Permissions:**
  - Read-only access to assigned port documents.
  - Prohibited from editing, deleting, or exporting manifests.

---

## 3. Active User Personas (3 Core Roles)

| Name | Role | Email | Password |
|---|---|---|---|
| Marcus Vance | `super_admin` | `marcus.vance@vicustoms.com` | `password123` |
| Carlos Mendez | `warehouse` | `carlos.m@vicustoms.com` | `password123` |
| Destination Agent Staff | `agent` | `agent@vicustoms.com` | `password123` |