# VI Customs Brokers & Logistics
## Client Workflow & Operations User Guide

**Target Audience:** Warehouse Operators, Destination Agents, Administrators  
**Business Profile:** NVOCC / Freight Forwarding Agent  
**Service Region:** Eastern Caribbean (Miami CFS ➔ Anguilla, Tortola, St. Kitts, St. Maarten, etc.)  

---

## 1. The 3-Step Streamlined Cargo Workflow

```
[ Step 1: Warehouse Receipts ]
             │  (Cargo intake, weighing, measuring, barcode label)
             ▼
[ Step 2: House Bills of Lading (HBL) ]
             │  (Customer consignment documentation)
             ▼
[ Step 3: Master Bills of Lading & Ocean Manifests ]
                (Feeder vessel carrier link & 1-click customs manifest)
```

---

## 2. Step-by-Step Operator Instructions

### Step 1: Cargo Intake (`1. Warehouse Receipts`)
*When commercial or personal cargo arrives at the Miami CFS facility.*

1. Navigate to **`1. Warehouse Receipts`** in the sidebar.
2. Click **`+ Create Warehouse Receipt`** at top right.
3. Select or create the **Customer** (unified directory: can be Shipper or Consignee).
4. Enter:
   - **Packages / Pieces** (e.g., *Boxes, Pallets, Crates*)
   - **Gross Weight (lbs)** and **Package Dimensions** (Length × Width × Height in inches)
   - Volume (**CFT** and **CBM**) is calculated automatically.
   - **Destination Port** (e.g., *AXA - Road Bay Port*, *TOV - Road Town Port*, etc.)
5. Click **`Save Receipt`**.
   > **Result:** System issues a numeric receipt starting at `3100` (e.g., `WR-2026-3101`) and provides a printable barcode label.

---

### Step 2: Customer House Bills (`2. House Bills of Lading`)
*Convert received warehouse cargo into individual customer House Bills of Lading (HBL).*

1. Navigate to **`2. House Bills of Lading`** in the sidebar.
2. Select the received cargo receipt(s) to convert.
3. Verify Shipper, Consignee, Destination, and Weight (all pre-filled).
4. Click **`Create House Bill`**.
   > **Result:** House Bill is generated (e.g., `HBL-2026-0001`) and marked as ready for Master B/L consolidation.

---

### Step 3: Master Ocean B/L & Manifest (`3. Master Bills & Manifests`)
*Consolidate House Bills into a Master Ocean Bill of Lading and generate the official Ocean Manifest.*

1. Navigate to **`3. Master Bills & Manifests`** in the sidebar.
2. Create or view the Master Ocean Bill of Lading (`BL-VI-2026-XXXX`):
   - Select the feeder vessel (e.g., *M/V Caribbean Carrier*) and ocean carrier (*Tropical Shipping*).
   - Enter the leased ocean container number (e.g., *MSKU-829104-5*) and bolt seal number (*SEAL-VI-8821*).
   - Select the consolidated House Bills. Total pieces, weight, and volume aggregate automatically.
3. **1-Click Manifest:** Click **`Generate Manifest`** to generate the official Customs Cargo Manifest (`MNF-2026-XXXX`).
4. **Print Ocean B/L:** Standard full-page ocean shipping Bill of Lading ready for export clearance.

---

## 3. Destination Port Operations (`Agent Portal`)

1. Destination Agents log in with role **Agent**.
2. **Agent Dashboard (`/agent/dashboard`):**
   - **Incoming Ships:** Real-time destination port arrivals.
   - **Cargo Volume:** Dynamic CBM, CFT, and scheduled package count.
   - **Ready Documents:** Direct access to Master Bills and Customs Manifests.
   - **Inbound Consignments:** Displays vessel, container, seal, ETA, and direct **B/L Access**.
3. **Permissions:** Agents have read-only access to their assigned destination documentation (no editing or deletion of manifests).
