# VI Customs Brokers & Logistics — Full System Validation & QA Checklist

> **Purpose:** Quality Assurance and End-to-End Validation Protocol verifying multi-persona authentication, business logic accuracy, and database integrity.  
> **Status:** Backend Server Operational • PostgreSQL Database Connected • Frontend Clean Slate.

---

## 👥 1. Persona Access & Role Permissions Matrix

| Persona | Login Email | Default Password | Role Key | Permitted Operations | Restricted Operations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Carlos Mendez** | `carlos.m@vicustoms.com` | `<CONFIGURED_IN_SEED_OR_ENV>` | `warehouse` | Customers, WR Intake, Cargo Staging, 4x6 Label Print | Issuing HBLs, Master Consolidations, B/L Hold/Release |
| **Sarah Jenkins** | `sarah.j@vicustoms.com` | `<CONFIGURED_IN_SEED_OR_ENV>` | `documentation` | Customers, House B/L Issuance, Ocean Manifests | B/L Hold/Release, User Management, Warehouse Staging |
| **Marcus Vance** | `marcus.vance@vicustoms.com` | `<CONFIGURED_IN_SEED_OR_ENV>` | `super_admin` | **Unrestricted HQ Console:** All Modules, Consolidations, B/L Hold/Release, Settings, Users | None (Full Access) |
| **Destination Agent** | `agent@vicustoms.com` | `<CONFIGURED_IN_SEED_OR_ENV>` | `agent` | **Secure Agent Portal:** Inbound Destination Shipments, Released B/Ls, Delivery Orders | Editing WRs, Placing Holds |

---

## 🧪 2. End-to-End Operational Lifecycle Test Cases

### Test Case 1: Warehouse Intake & Volume Math (Carlos Mendez)
- [ ] Login as Carlos Mendez (`operations`).
- [ ] Create or select customer *Atlantic Trading Co.* (Verify destination port auto-selects `NAS`).
- [ ] Intake Warehouse Receipt with 2 package rows:
  - Row 1: 8 Cartons, $42 \times 38 \times 48$ inches, 1200 lbs $\rightarrow$ Verify live CFT: $\frac{42 \times 38 \times 48}{1728} \times 8 = \approx 354.67$ CFT ($\approx 10.04$ CBM).
  - Row 2: 6 Cartons, $42 \times 38 \times 24$ inches, 850 lbs $\rightarrow$ Verify live CFT: $\frac{42 \times 38 \times 24}{1728} \times 6 = \approx 133.00$ CFT ($\approx 3.77$ CBM).
- [ ] Verify summary bar displays **14 Pieces, 2050 lbs, 487.67 CFT, 13.81 CBM**.
- [ ] Click **Save & Generate WR** $\rightarrow$ Verify status is `Ready for Consolidation`.
- [ ] Open 4x6 Label Preview $\rightarrow$ Verify barcode, QR code, and **Piece 1 of 14** pagination.

### Test Case 2: House B/L Issuance with Zero Data Re-entry (Sarah Jenkins)
- [ ] Login as Sarah Jenkins (`documentation`).
- [ ] Navigate to `House Bills of Lading (HBL)` $\rightarrow$ Click `+ Issue House B/L`.
- [ ] Select customer *Atlantic Trading Co.*.
- [ ] Check Carlos's newly intaked Warehouse Receipt.
- [ ] Verify system auto-populates pieces (14), weight (2050 lbs), volume (9.02 CBM), and destination (`NAS`).
- [ ] Click **Issue House Bill of Lading** $\rightarrow$ Verify `HBL-2026-XXXX` generated with legal multimodal format.

### Test Case 3: Container Packing & Master B/L Auto-Generation (Marcus Vance)
- [ ] Login as Marcus Vance (`super_admin`).
- [ ] Open `Consolidations Wizard` $\rightarrow$ Select Destination Port `NAS - Nassau, Bahamas`.
- [ ] Check Sarah's newly issued HBL (`HBL-2026-XXXX`).
- [ ] Verify container fill gauge reflects cargo volume against container capacity (e.g. 40' HC 76.2 CBM).
- [ ] Assign vessel (*MV Island Voyager*), voyage (*V.2026-19E*), container (*CMAU-109482-7*), and bolt seal (*SEAL-VI-99482*).
- [ ] Click **Create Consolidation & Generate Master B/L**:
  - [ ] Verify Consolidation status becomes `Finalized`.
  - [ ] Verify linked HBL and WR statuses cascade to `Consolidated`.
  - [ ] Verify Master Ocean Shipment (`SHP-2026-XXXX`) generated with 6 milestones.
  - [ ] Verify Master B/L (`BL-VI-2026-XXXX`) generated with linked HBL table.
  - [ ] Verify Customs Manifest (`MNF-2026-XXXX`) generated.

### Test Case 4: Hold / Release Security Governance (Marcus Vance)
- [ ] Open newly created Master B/L (`BL-VI-2026-XXXX`).
- [ ] Click **Place B/L On Hold** $\rightarrow$ Enter reason *"Payment Pending: Freight Charges Unsettled"*.
- [ ] Verify red **ON HOLD** banner and watermark appear.
- [ ] Logout and login as David Cartwright (`agent`):
  - [ ] Open Nassau Agent Portal $\rightarrow$ Navigate to `Documents & Locked B/Ls`.
  - [ ] Verify red lock notice prevents download and blocks cargo delivery handover.
- [ ] Relog as Marcus Vance (`super_admin`) $\rightarrow$ Click **Clear Hold & Release B/L**.
- [ ] Relog as David Cartwright $\rightarrow$ Verify document is unlocked and download is permitted.

---

## 🔌 3. API & Database Integrity Validation

### Health Check Commands:
```bash
# General Server Health
curl http://127.0.0.1:5000/health
# Expected: {"success": true, "message": "VI Customs Brokers & Logistics API is running"}

# PostgreSQL Connection Health
curl http://127.0.0.1:5000/health/db
# Expected: {"success": true, "message": "PostgreSQL database connected and healthy", "database": "connected"}
```

### Database Row Count Verification:
Ensure core tables exist and transactional tables remain at 0 until transactions are submitted:
```sql
SELECT 
  (SELECT COUNT(*) FROM users) AS users_count,
  (SELECT COUNT(*) FROM roles) AS roles_count,
  (SELECT COUNT(*) FROM ports) AS ports_count,
  (SELECT COUNT(*) FROM settings) AS settings_count,
  (SELECT COUNT(*) FROM warehouse_receipts) AS receipts_count,
  (SELECT COUNT(*) FROM house_bills) AS hbl_count,
  (SELECT COUNT(*) FROM shipments) AS shipments_count;
```
**Target State:** `users: 4`, `roles: 4`, `ports: 11`, `settings: 1`, `receipts: 0`, `hbl: 0`, `shipments: 0`.

---

## 💻 4. Frontend Compilation & Zero-Breakage Check

Execute build verification in `frontend (2)` directory:
```bash
npm run build
```
**Acceptance Criteria:**
- Exit code: `0`
- Zero TypeScript or bundling syntax errors
- All 4 login buttons functional
- Clean slate state displayed across tables
