# VI Customs Brokers & Logistics
## End-to-End Ocean Freight Operations User Guide

**Target Audience:** Operations Staff, Documentation Officers, Warehouse Managers & Clients  
**Business Model:** NVOCC / Freight Forwarding Agent (CFS Cargo Intake ➔ Container Consolidation ➔ Ocean Shipment ➔ Master B/L & Outward Manifest)

---

## 🌟 Overview: The 5-Stage Logistics Pipeline

Our logistics management system is structured around a sequential, zero-friction 5-stage pipeline. **Data entered at Stage 1 flows automatically across all subsequent stages without requiring duplicate data entry.**

```
[ Stage 1: Warehouse Receipts ]
             │  (Cargo Intake & Staging)
             ▼
[ Stage 2: House Bills of Lading (HBL) ]
             │  (Customer Order & Bill Issuance)
             ▼
[ Stage 3: Container Consolidation ]
             │  (Packing Multiple Customer Cargo into 1 Container Box)
             ▼
[ Stage 4: Ocean Freight Shipments ]
             │  (Booking Voyage & Verifying Carrier Milestones)
             ▼
[ Stage 5: Master Bills (MBL) & Outward Manifest ]
                (Carrier Master B/L Issuance & 1-Click Customs Manifest)
```

---

## 📋 Step-by-Step Operator Instructions

### Stage 1: Cargo Intake (Warehouse Receipts)
*When customer goods arrive at the Miami CFS warehouse facility.*

1. Navigate to **Warehouse Receipts** in the left sidebar menu.
2. Click **`+ Create Warehouse Receipt`** at the top right.
3. Select or enter:
   - **Customer Name** (e.g., *Albury's Hardware* or *Bahama Foods Ltd*)
   - **Packages / Pieces** (e.g., *4 Pallets / Cartons*)
   - **Gross Weight (lbs)** and **Volume (CFT/CBM)**
   - **Destination Port** (e.g., *NAS - Nassau Container Port*)
4. Click **`Save Receipt`**.
   > **Result:** A receipt number is issued (e.g., `WR-2026-0120`) and marked as **Staged in Warehouse**.

---

### Stage 2: Issue Customer Bill (House Bills of Lading)
*Convert staged warehouse cargo into a legally binding customer House Bill of Lading (HBL).*

1. Navigate to **House Bills of Lading** in the sidebar.
2. Switch to **Tab 1: `Select Warehouse Cargo to Issue House Bill`**.
3. Locate the staged warehouse receipt created in Stage 1.
4. Click **`[ + Issue House B/L ]`** on the row.
   - The form opens with Customer, Shipper, Consignee, Destination, and Weight **automatically pre-filled**.
5. Review the details and click **`Create House Bill`**.
   > **Result:** Customer House Bill is generated (e.g., `HBL-2026-0042`) and marked as **Ready for Consolidation**.

---

### Stage 3: Pack Container (Container Consolidation)
*Group multiple customers' House Bills into one physical ocean container box.*

1. Navigate to **Container Consolidation** in the sidebar.
2. Switch to **Tab 1: `Select Customer Bills to Consolidate`**.
3. Select the checkboxes next to the customer House Bills you want to pack together.
4. Click the green action button: **`[ Build Container (X Selected) ]`**.
5. In the build modal, specify:
   - **Container #** (e.g., `MEDU7891234` or `CONT-101`)
   - **Bolt Seal #** (e.g., `SEAL-VI-88901`)
   - **Ocean Vessel** & **Ocean Carrier** (e.g., *Tropical Shipping Line*)
6. Click **`Build Consolidation`**.
   > **Result:** A consolidation container box record is created (e.g., `CNS-2026-462`), and its status becomes **Ready for Shipment**.

---

### Stage 4: Prepare Shipment (Ocean Freight Shipments)
*Register the ocean voyage and prepare the container box for terminal dispatch.*

1. Navigate to **Ocean Shipments** in the sidebar.
2. Switch to **Tab 1: `Select Container Boxes to Ship`**.
3. Locate your consolidation box with the badge `📦 Ready to Ship`.
4. Click **`[ 🚢 Ship This Box ]`**.
   - The **Shipment Ready Form** opens in compact, centered view.
   - Container Number, Bolt Seal, Destination Port, Total Packages, Weight, and Vessel are **100% auto-filled**.
5. Click **`Confirm Shipment & Go to Master B/L ➔`**.
   > **Result:** The ocean shipment is booked (e.g., `SHP-2026-0003`) and the application **automatically redirects directly to Master Bills & Manifests**!

---

### Stage 5: Issue Master B/L & Customs Manifest (Master Bills)
*Issue the official carrier Master Bill of Lading and generate the outward customs manifest in 1 click.*

1. You are now on **Master Bills & Manifests**.
2. Open **Tab 1: `Select Ready Shipments for Master B/L`**.
3. Locate the active shipment from Stage 4 with the badge `📄 Ready for Master B/L`.
4. Click **`[ 📄 Issue Master B/L ]`**.
   - The Master B/L form opens pre-populated with the ocean carrier, vessel, container #, seal #, cargo weights, and linked House Bills.
5. Click **`Issue Master B/L`**.
   > **Result:** Master Bill of Lading (e.g., `BL-VI-2026-0005`) is officially issued.
6. Click the three dots **`(...)`** on the issued Master B/L row ➔ Select **`1-Click Outward Manifest`**.
   > **Result:** The complete customs cargo manifest is compiled in under 1 second with all consolidated consignments itemized for port customs clearance!

---

## 🏆 Key Client Improvements & System Benefits

| Operational Capability | Legacy System | Updated NVOCC System |
| :--- | :--- | :--- |
| **Data Re-Entry** | Operator had to re-type Container #, Seal #, and weights 4 times across different pages. | **Zero Duplicate Typing:** Data flows seamlessly between steps with auto-filling forms. |
| **Workflow Guidance** | Users got lost after building a container; Ocean Shipments was missing from navigation. | **Sequential 2-Tab Layout:** Every screen has a dedicated intake tab and an active list tab. |
| **Screen Usability** | Modals covered the full 1400px screen, requiring awkward horizontal & vertical scrolling. | **Clean & Compact:** Sized at 620px-680px, centered on screen with clear action buttons. |
| **Customs Compliance** | Manual compilation of manifests took 30-45 minutes per container. | **1-Click Generation:** Outward manifest created automatically from Master B/L. |
| **Tracking Traceability** | Disconnected records prevented end-to-end cargo visibility. | **Unified Tracking:** Master tracking number links House Bills, Container, and Vessel milestones. |

---

*Document Version: 2.0 (Production Release)*  
*System: VI Customs Brokers & Logistics Management Platform*
