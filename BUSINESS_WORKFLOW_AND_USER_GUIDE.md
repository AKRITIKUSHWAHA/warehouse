# VI Customs Brokers & Logistics
## Business Workflow & User Guide (Standard Operating Procedures)

Welcome to the **VI Customs Brokers & Logistics** freight management platform. This system is purpose-built for Non-Vessel Operating Common Carrier (NVOCC) operations between Miami Container Freight Station (CFS) and the Eastern Caribbean (Anguilla, Tortola BVI, St. Kitts, St. Maarten, and neighboring ports).

---

## 1. The Core 3-Step Cargo Workflow

Cargo flows smoothly from initial dock intake in Miami to final port handover at the destination island in 3 streamlined steps:

```
    [ STEP 1 ]                      [ STEP 2 ]                      [ STEP 3 ]
Warehouse Receipts (3100+)   ──►   House Bills of Lading   ──►   Master Ocean B/L &
(Intake, Dimensions, Label)        (Customer Consignment)         Customs Ocean Manifest
```

---

## 2. User Roles & Access

| Role | Default Login | Primary Responsibilities | Permissions & Constraints |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `marcus.vance@vicustoms.com` | Full executive governance, user management, hold releases, master configuration. | Full Access (Can create, edit, delete, release holds). |
| **Warehouse** | `carlos.m@vicustoms.com` | Receiving cargo at dock, creating customers, measuring dims/weight, generating Warehouse Receipts (starting 3100), printing labels, drafting House Bills. | Intake & Drafting. **Delete permission restricted** (cannot delete receipts, bills, or inventory). |
| **Agent** | `agent@vicustoms.com` | Reviewing inbound vessels, accessing assigned Master B/Ls, viewing outward manifests, checking cargo volume & packages. | **Read-only access**. Cannot edit, delete, or export manifests. |

---

## 3. Step-by-Step Operating Guide

### Step 1: Receiving Cargo at Miami Dock (`1. Warehouse Receipts`)
1. Click **`1. Warehouse Receipts`** in the sidebar and select **`+ New Receipt`**.
2. Select or create the **Customer** (works interchangeably as Shipper or Consignee).
3. Enter package details:
   - Piece count and packaging type (e.g. Boxes, Crates, Pallets).
   - Gross Weight (lbs).
   - Package Dimensions: Length × Width × Height (inches).
   - System automatically calculates **CFT** and **CBM**.
4. Save the receipt. A numeric receipt number starting at `3100` (e.g., `WR-2026-3101`) is generated.
5. Print the barcode cargo label.

---

### Step 2: Preparing House Bills of Lading (`2. House Bills of Lading`)
1. Click **`2. House Bills of Lading`** in the sidebar.
2. Select received warehouse items to convert into a House Bill (`HBL-2026-XXXX`).
3. Confirm destination port (e.g., `AXA - Road Bay Port`), shipper, consignee, and declared freight value.
4. Save the House Bill. It is now ready for container consolidation.

---

### Step 3: Master Ocean Bill of Lading & Manifest (`3. Master Bills & Manifests`)
1. Click **`3. Master Bills & Manifests`** in the sidebar.
2. Create or open a Master Ocean Bill of Lading (`BL-VI-2026-XXXX`):
   - Select the feeder vessel (e.g., *M/V Caribbean Carrier*) and carrier (*Tropical Shipping*).
   - Enter the leased ocean container number (e.g., *MSKU-829104-5*) and bolt seal number (*SEAL-VI-8821*).
   - Link the consolidated House Bills. Total volume, weight, and packages aggregate automatically.
3. **1-Click Manifest:** Click **`Generate Manifest`** to produce the official Customs Cargo Manifest (`MNF-2026-XXXX`) containing all line items in standard outward format.
4. Print the **Full-Page Ocean Bill of Lading** (BIMCO standard format filling 100% of Letter/A4 paper).

---

### Destination Port Operations (`Agent Portal`)
1. When logged in as **Agent**, the **Agent Dashboard** provides live metrics:
   - **Incoming Ships:** Inbound vessel arrivals for the agent's port.
   - **Cargo Volume:** Real-time volume (`CBM` and `CFT`) and package count.
   - **Ready Documents:** Direct access to Master Bills and Customs Manifests.
2. Agents can view inbound consignments and inspect full Master B/Ls with hold statuses.
