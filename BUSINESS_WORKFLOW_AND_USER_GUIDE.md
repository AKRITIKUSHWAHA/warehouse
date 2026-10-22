# Caribbean Ocean Freight & Warehouse Management System
## Standard Operating Procedures & User Guide

Welcome to your custom **Warehouse & Ocean Freight Management System**. This system is specifically designed for your Miami Container Freight Station (CFS) and your Eastern Caribbean trade lane (serving Tortola BVI, St. Kitts, St. Maarten, and neighboring ports).

---

## 1. Quick Overview: The 5-Step Process

Here is how cargo flows through your system from arrival at your Miami dock to final delivery at the island:

```
  [ STEP 1 ]               [ STEP 2 ]               [ STEP 3 ]               [ STEP 4 ]               [ STEP 5 ]
Miami Inbound     ──►    Container         ──►    Master Bill of   ──►    1-Click Customs   ──►   Island Arrival
Receiving Dock           Consolidation            Lading (MBL)            Manifest File           & Final Delivery
(Issue Receipt)          (Pack Container)         (Carrier Link)          (Auto-Generated)        (Handover to Customer)
```

---

## 2. Who Uses Which Portal?

| User / Role | Portal / Screen | What They Do |
| :--- | :--- | :--- |
| **Warehouse Dock Staff** | `Warehouse Receipts` | Receive packages from US suppliers (Amazon, Walmart, commercial vendors), scan barcodes, weigh, measure, and assign rack locations. |
| **Operations Manager** | `Container Consolidation` & `Master B/L` | Group packages by destination island, assign leased ocean containers with bolt seals, and issue the Master Bill of Lading. |
| **Customs Documentation** | `Manifests` & `Document Center` | Generate the official Customs Cargo Manifest in 1 click and download export paperwork. |
| **Destination Port Agents** | `Agent Portal` (`/agent/shipments`) | Unload the container at Tortola or St. Kitts, verify packages against customs release, and mark shipments **Delivered** upon customer pickup. |
| **End Customers** | `Cargo Tracking` (`/tracking`) | Enter a tracking number to see real-time updates (Received in Miami ➔ In Transit ➔ Customs Cleared ➔ Ready for Pickup). |

---

## 3. Step-by-Step Walkthrough

### Step 1: Receiving Cargo at Miami Dock (`Warehouse Receipts`)
* **When:** A delivery truck drops off cargo at your Miami warehouse.
* **How to do it:**
  1. Go to **`Warehouse Receipts`** and click **`+ New Receipt`**.
  2. Select the **Shipper** (e.g. Amazon, Supplier) and the **Consignee** (Customer in the Caribbean).
  3. Enter package details: Piece count, Gross Weight (lbs), and Dimensions (Length × Width × Height).
  4. Assign a **Storage Location** (e.g., Rack A-12).
* **Result:** The system creates a unique Receipt (e.g., `WR-2026-0045`) and generates a printable barcode label. A House Bill of Lading (HBL) is automatically ready for the customer.

---

### Step 2: Packing the Ocean Container (`Container Consolidation`)
* **When:** You are ready to pack an ocean container (20ft or 40ft) for a specific island.
* **How to do it:**
  1. Go to **`Container Consolidation`** and click **`+ New Consolidation`**.
  2. Select the **Destination Port** (e.g., `Road Town Port, Tortola`).
  3. Enter the **Container Number** (leased from your ocean carrier) and the **Bolt Seal Number**.
  4. Select the pending warehouse receipts to include in this container.
  5. The system automatically calculates total pieces, total weight, and total volume (CBM).
  6. Click **Confirm Consolidation**.
* **Result:** A unique **Consolidation Number** (e.g., `CNS-2026-0082`) is created.

---

### Step 3: Issuing the Master Bill of Lading (`Master Bills of Lading`)
* **When:** The container is packed, sealed, and booked with your ocean feeder vessel.
* **How to do it:**
  1. Go to **`Bills of Lading`** and click **`+ Issue Master B/L`**.
  2. **Step 1:** Select your **Consolidation Number** from the top dropdown.
     * *The system instantly auto-fills the vessel, container number, seal number, destination port, and all linked House B/Ls!*
  3. Verify the Shipper and Consignee/Agent details.
  4. Select your **Feeder Vessel** from the Fleet dropdown.
  5. Click **Issue Master B/L**.
* **Result:** Your legal ocean contract (Master B/L) is officially generated.

---

### Step 4: 1-Click Customs Manifest (`Manifests`)
* **When:** Before the feeder vessel departs Miami, so destination customs can begin clearance.
* **How to do it:**
  1. Go to **`Manifests`**.
  2. Click **`Generate Manifest`** and select the Master B/L.
  3. The system compiles every package, description, piece count, weight, and consignee into the official customs format.
  4. Download or print the PDF for immediate customs submission.
* **Result:** Zero manual re-typing. Destination customs receives complete cargo documentation before the vessel arrives.

---

### Step 5: Island Arrival & Final Delivery (`Agent Portal`) — The Final Step
* **When:** The feeder vessel docks at the Caribbean island (e.g. Tortola, St. Kitts).
* **How to do it:**
  1. The local island agent logs into the **Agent Portal** (`/agent/shipments`).
  2. The agent opens (deconsolidates) the container and verifies cargo against the manifest.
  3. Once local duties and clearance fees are settled, the status updates to **Customs Cleared**.
  4. When the customer comes to collect their cargo (or for local delivery):
     * The agent clicks **`Mark Delivered`** / **`Release Cargo`**.
     * Customer signature and delivery timestamp are recorded.
* **Result:** The shipment lifecycle is marked **DELIVERED & COMPLETED**.

---

## 4. Key Highlights Tailored to Your Business

1. **Consolidation-First Workflow:** You create your consolidation number first, select it in the Master B/L, and all cargo totals and House B/Ls populate with one click.
2. **Eastern Caribbean Focus:** Clean port list featuring your active trade lanes (Tortola, St. Kitts, St. Maarten) with zero clutter.
3. **Leased Container Friendly:** Enter container numbers and bolt seals directly without needing complex fleet tracking.
4. **Responsive & Fast:** Works cleanly on laptops, desktops, and warehouse tablets with fixed buttons and smooth scrolling.
5. **Centralized Customer Directory:** Shippers and Consignees are shared across all forms for instant lookups.

---

## 5. Summary Cheat Sheet

| Question | Answer |
| :--- | :--- |
| **Where does a shipment start?** | At **`Warehouse Receipts`** on your Miami receiving dock. |
| **Where are packages packed together?** | In **`Container Consolidation`** under a unique Consolidation #. |
| **Where is the ocean shipping contract created?** | In **`Master Bills of Lading`** by selecting the Consolidation #. |
| **Where is customs paperwork created?** | In **`Manifests`** with 1-click automatic generation. |
| **Where does the final delivery happen?** | In the **`Agent Portal` (`/agent/shipments`)** at the destination island port. |
