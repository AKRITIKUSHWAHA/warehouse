# Ocean Freight & Warehouse Management System (WMS)
## Complete End-to-End Business Workflow & User Guide

---

## 1. Executive Summary & Business Model

### 1.1 Business Identity
* **Role:** Freight Forwarder & NVOCC (Non-Vessel-Operating Common Carrier).
* **Headquarters & CFS Warehouse:** Miami, Florida, USA.
* **Core Trade Lane:** Eastern Caribbean Islands (Road Town, Tortola - British Virgin Islands; Basseterre, St. Kitts; Philipsburg, St. Maarten, etc.).
* **Operating Model:**
  * Customers order goods in the US (Amazon, Walmart, commercial suppliers) and ship them to the Miami warehouse.
  * The Miami warehouse consolidates small LCL (Less-than-Container Load) packages into ocean containers leased from ocean carriers (VOCCs like King Ocean, Tropical Shipping).
  * Containers are loaded onto feeder vessels destined for Caribbean ports.
  * Local island agents clear customs, deconsolidate packages, and deliver them to consignees.

---

## 2. Dashboards Overview (Kisko Kaunsa Dashboard Milta Hai)

| Dashboard | Target User | Main Purpose |
| :--- | :--- | :--- |
| **Superadmin Dashboard** (`/superadmin/dashboard`) | Business Owner / Operations Director | Pure business ka bird-eye view. Total revenue, active consolidations, pending manifests, active containers in transit, aur overall warehouse capacity. |
| **Warehouse Operations View** (`/superadmin/warehouse-receipts`) | Miami Warehouse Dock Workers / Floor Supervisors | Daily inbound receiving, barcode scanning, cargo weighing/measuring, warehouse bin/rack locations, aur photo inspection. |
| **Agent Portal** (`/agent/dashboard` & `/agent/shipments`) | Caribbean Destination Port Agents (Tortola, St. Kitts) | Destination port par container unloading, deconsolidation, local customs clearance verification, aur final customer handover/delivery. |
| **Cargo Tracking Portal** (`/tracking` / `/portal`) | End Customers / Consignees | Public live tracking where customers enter tracking/WR number to see where their package is (Miami CFS ➔ In Transit ➔ Customs Cleared ➔ Ready for Pickup). |

---

## 3. Step-by-Step Complete Workflow (Starting to Ending Delivery)

```
[Step 1: Miami Receiving Dock]
   US Suppliers deliver goods ──► Warehouse Receipt (WR) created ──► Barcode & House B/L issued
                 │
                 ▼
[Step 2: Container Consolidation]
   Group all packages for same island ──► Assign Container # & Bolt Seal # ──► Consolidation # generated
                 │
                 ▼
[Step 3: Master Bill of Lading (MBL)]
   Select Consolidation # ──► Auto-loads HBLs, Vessel & Container ──► Legal Carrier Contract issued
                 │
                 ▼
[Step 4: Customs Manifest Generation]
   1-Click Generate Manifest ──► Official document submitted to Island Customs ──► Ship sails
                 │
                 ▼
[Step 5: Island Port Arrival & Deconsolidation]
   Feeder ship docks at Island ──► Local Agent unloads container ──► Verifies packages
                 │
                 ▼
[Step 6: Final Delivery / Handover] (LAST STEP)
   Customs duty paid ──► Agent marks "Delivered" ──► Consignee takes delivery ──► COMPLETED
```

---

## 4. Menu-by-Menu Guide (Har Menu Kya Kaam Karta Hai)

### Phase 1: Inbound Receiving at Miami CFS (The Start)

#### 1. `Warehouse Receipts` (`/superadmin/warehouse-receipts`)
* **Kya Kaam Hai:** Jab koi truck Miami warehouse ke receiving dock par aata hai, to staff is menu par jaata hai.
* **Actions:**
  * Nayi receipt banayein (`+ Create Receipt`).
  * Shipper (e.g. Amazon, BestBuy) aur Consignee (Caribbean customer) select karein.
  * Package details: Pieces, Gross Weight (Lbs), Dimensions (L × W × H in inches) aur Storage Location (Rack/Bin).
  * Auto-generates unique **WR Number** (e.g., `WR-2026-00123`).
* **Output:** Customer ko receiving notification aur barcode label print hota hai.

#### 2. `Shipments / House Bills of Lading (HBL)` (`/superadmin/shipments`)
* **Kya Kaam Hai:** Individual customer ka freight contract. Har customer package ka ek unique House B/L banta hai jo customer ke hath me transport receipt ke roop me rehta hai.

#### 3. `Customers Directory` (`/superadmin/customers`)
* **Kya Kaam Hai:** US Shippers, local businesses, aur Caribbean consignees ka master address book.
* **Benefit:** Forms me customer name type karte hi unka email, tax ID aur address auto-fill ho jata hai.

---

### Phase 2: Consolidation & Container Stuffing

#### 4. `Container Consolidation` (`/superadmin/container-consolidation`)
* **Kya Kaam Hai:** LCL shipments ko ek single ocean container me pack (stuff) karna.
* **Step-by-Step:**
  1. Click **`+ New Consolidation`**.
  2. Select Destination Port (e.g., `Road Town Port, Tortola`).
  3. System automatically wahi warehouse receipts dikhayega jo Tortola ke liye pending hain.
  4. Select Ocean Container Number (leased from carrier) aur **Bolt Seal Number** enter karein.
  5. Checkbox se packages select karein. Total weight aur CBM screen par real-time tally hota hai.
  6. Click **Confirm Consolidation** ➔ System unique `Consolidation #` generate karta hai (e.g., `CNS-2026-0045`).

---

### Phase 3: Ocean Booking & Carrier Master Documentation

#### 5. `Master Bills of Lading (B/L)` (`/superadmin/bills-of-lading`)
* **Kya Kaam Hai:** Pure ocean container ka main transport document jo Ocean Carrier (shipping line) ke sath legally bind karta hai.
* **Special Client Feature (1-Click Automation):**
  * Form kholte hi sabse upar **`Step 1: Select Consolidation Number`** aata hai.
  * Jaise hi aap consolidation select karte hain, container number, vessel, carrier, destination port, aur saare linked House B/Ls table me automatically load ho jaate hain!
  * Weight aur volume khud calculate ho jaate hain.
  * Click **`Issue Master B/L`** ➔ Official Master B/L release ho jata hai.

#### 6. `Fleet Directory` (`/superadmin/fleet`)
* **Kya Kaam Hai:** Caribbean me chalne wali small feeder vessels ka directory record (e.g. *M/V Island Trader*, *M/V Caribbean Express*). Master B/L form me direct dropdown se select ho jaata hai.

#### 7. `Ports Management` (`/superadmin/ports`)
* **Kya Kaam Hai:** Origin port (Port of Miami / Miami CFS) aur Caribbean Destination ports (Tortola, St. Kitts, St. Maarten) ki list aur customs port codes manage karna.

---

### Phase 4: Customs Filing & Export

#### 8. `Customs Manifests` (`/superadmin/manifests`)
* **Kya Kaam Hai:** Island Customs Authority (BVI Customs / St. Kitts Customs) ko declare karne ke liye legally required cargo manifest.
* **Automation:**
  * Master B/L banne ke baad, simply manifest page par jaakar **1-Click Generate** karein.
  * System container ke andar maujood har House B/L, piece count, description aur consignee details ko official customs export format me assemble kar deta hai.

#### 9. `Document Center` (`/superadmin/documents`)
* **Kya Kaam Hai:** Sabhi generated documents ka centralized archive:
  * Warehouse Receipts (PDF)
  * Barcode Shipping Labels
  * House Bills of Lading (HBL)
  * Master Bills of Lading (MBL)
  * Ocean Cargo Manifests
  * Commercial Invoices & Export Packing Lists

---

### Phase 5: Arrival, Island Deconsolidation & Final Delivery (The Ending)

#### 10. `Agent Portal` (`/agent/dashboard` & `/agent/shipments`) — **FINAL DELIVERY LOCATION**
* **Kaun Use Karta Hai:** Caribbean island ke local branch agents (e.g., VI Customs Brokers & Logistics at Tortola).
* **Ending Steps (Khatam Kaise Hota Hai):**
  1. Feeder ship island port par dock hoti hai.
  2. Local Agent container receive karta hai aur warehouse me open (deconsolidate) karta hai.
  3. Har package ko tally karke verify karta hai.
  4. Local customs duties aur landing fees pay hone par shipment status **`Customs Cleared`** ho jata hai.
  5. **Final Handover:**
     * Customer warehouse counter par aata hai ya door delivery schedule hoti hai.
     * Agent shipment par jakar **`Mark Delivered`** / **`Release Cargo`** par click karta hai.
     * Customer signature capture hoti hai aur Proof of Delivery (POD) record save hota hai.
     * **Status ho jata hai: `DELIVERED` (Cycle Closed).**

#### 11. `Cargo Tracking Portal` (`/superadmin/cargo-tracking` & Public Tracking)
* **Kya Kaam Hai:** Pure safari ke dauran package ka live milestone track karta hai:
  * 🟡 `Received at Miami CFS`
  * 🔵 `Consolidated into Container [TGHU1234567]`
  * 🟣 `Sailing on Vessel M/V Island Trader`
  * 🟠 `Arrived at Destination Port (Customs Hold)`
  * 🟢 `Customs Cleared - Ready for Pickup`
  * 🏁 **`Delivered to Consignee`**

---

## 5. Client Satisfaction Checklist (Client Ke Rules Ke Mutabik)

| Client Requirement (From client.md) | System Status | Verification |
| :--- | :--- | :--- |
| **Consolidation First Workflow** | ✅ 100% Implemented | User creates consolidation number first, selects it in Master B/L, and all linked HBLs load automatically. |
| **1-Click Customs Manifest** | ✅ 100% Implemented | Manifest automatically pulls from the active Master B/L and linked HBLs. |
| **No Bahamas Routes (Small Caribbean Feeder Ships)** | ✅ Verified | Bahamas eliminated from database and dropdowns. Focused strictly on Eastern Caribbean (Tortola BVI, St. Kitts, St. Maarten). |
| **NVOCC Leased Containers (No vessel/fleet ownership)** | ✅ Aligned | Container numbers are recorded from leased carrier boxes with customs bolt seals. Fleet directory acts as an agent registry. |
| **Interchangeable Shipper / Consignee** | ✅ Implemented | Both shippers and consignees can be pulled seamlessly from the central customer directory. |
| **Responsive, Non-Clipping Forms** | ✅ Tested | All modal dialogs (Receipts, Shipments, Master B/L, Port, Agent) have sticky headers/footers and smooth scrollable bodies. |

---

## 6. Summary: Quick Reference

* **Kahan Se Shuru Hoga?** ➔ **`Warehouse Receipts`** (Miami CFS Inbound Dock)
* **Beech Me Kya Hoga?** ➔ **`Container Consolidation`** ➔ **`Master B/L`** ➔ **`Customs Manifest`** (Miami Loading & Ocean Voyage)
* **Kahan Par Khatam Hoga?** ➔ **`Agent Portal` (`/agent/shipments`)** (Tortola/St. Kitts Island Warehouse - Final Handover / Delivered)
