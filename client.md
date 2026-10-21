# Client Requirements & Feedback Summary (Kedreana)

**Date of Communication:** 18 October  
**Client:** Kedreana  
**Project:** Warehouse & Ocean Freight Management System  
**Business Profile:** NVOCC / Freight Forwarding Agent (Eastern Caribbean Operations)

---

## 1. Raw Messages from Client (Transcript)

```text
[18 Oct, 16:41]
Customers and consignees. I only need customers. I want to be able to use them either way. They could be a consignee or shipper. Please remove that rule. I’ve been asking that for a long time. When I select my importer the customer account profile automatically changes. I don’t want it that way.

[18 Oct, 16:41]
The bill of lading form. I sent you a copy of how I wanted it. It’s supposed to fill the entire page. This isn’t the standard look.

[18 Oct, 16:45]
I need help understanding the master bill of lading and manifesting process. 

In the bill of lading process, we usually create our own consolidation number. That way when we create the master bill of lading, we select that particular consolidation number and the options of bills of ladings are there for selection. 

That master bill of lading usually has all the details which is then a one click process for creating the manifest.

[18 Oct, 16:53]
We don’t need the active voyage schedules. And operational status. We just need the fleet directory. I’d like to add my vessels and you build with our actual information

[18 Oct, 16:54]
We do not service Bahamas. It’s literally small vessels in the eastern Caribbean

[18 Oct, 16:54]
This is for a huge operation and that’s not what we do

[18 Oct, 16:55]
Please if you can clear the entire program I would appreciate it. I’d like to add the vessels we service

[18 Oct, 16:56]
Also, we do not manage equipment so the container fleet is not necessary

[18 Oct, 16:56]
We’re more or less NVOCC

[18 Oct, 16:56]
We don own any vessels. We are agents

[18 Oct, 16:57]
So with the containers, we get one from a VOCC, fill it and export.

[18 Oct, 16:57]
Let’s start fresh with the software then I can do the testing

[18 Oct, 16:57]
Thank you

[18 Oct, 17:00]
Also, no need for this classification
```

---

## 2. Core Business Understanding (Client Reality vs Current Software)

| Aspect | Current System (Over-engineered) | Client's Real Business (Actual Need) |
|---|---|---|
| **Role / Identity** | Carrier / Ship Owner (VOCC) | **NVOCC / Shipping Agent** (Non-Vessel Operating Common Carrier). |
| **Geographic Coverage** | Bahamas (Nassau / Freeport routes) | **Eastern Caribbean** (Small islands, feeder vessels). No Bahamas. |
| **Vessels** | Active voyage tracking, complex schedules & rotations | Simple **Vessel / Fleet Directory** to list their serviced vessels. |
| **Containers / Equipment** | Full Container Fleet & Equipment asset management | **No equipment management needed**. They lease containers from VOCCs, stuff them, and export. Only container/seal numbers are recorded. |
| **Parties (Contacts)** | Strict segregation (Commercial Importer, Shipper, Consignee) | **Single unified Customer directory**. Any contact can act as Shipper OR Consignee interchangeably. |
| **B/L Workflow** | Generic, disconnected Master B/L creation | **Consolidation Number ➔ Master B/L (HBL multi-select) ➔ 1-Click Manifest**. |
| **B/L Document Layout** | Compact / non-standard preview card | **Full-page standard ocean Bill of Lading** fitting standard letter/A4 print. |

---

## 3. Detailed Client Feedback & Action Items

### ① Customer & Consignee Rules
* **Problem:** System forces account classifications (Commercial Importer, Shipper, Consignee, etc.) and treats them as separate entities. Selecting an importer overwrites/changes the customer account profile.
* **Client Request:** 
  * Eliminate the distinction rule. Maintain a single list of **Customers**.
  * Any customer can be selected as a **Shipper** or a **Consignee**.
  * Remove the bug where selecting an importer changes the customer profile automatically.
  * Remove unnecessary classification tags.

---

### ② Bill of Lading (B/L) Document Design
* **Problem:** Current B/L view does not look like standard maritime shipping paperwork and leaves blank margin space.
* **Client Request:** 
  * The form must **fill the entire page** (Full Page 100% standard ocean Bill of Lading format).
  * Align styling with standard industry layouts (as per sample previously provided by client).

---

### ③ Master B/L & Manifest Process (Consolidation Workflow)
* **Client's Actual Operational Workflow:**
  1. **Consolidation Creation:** Warehouse staff creates House Bills of Lading (HBLs) under a specific **Consolidation Number**.
  2. **Master B/L Creation:** When creating a Master Bill of Lading (MBL), the user simply selects that **Consolidation Number**.
  3. **Auto-Populate HBLs:** All HBLs tied to that consolidation number appear as options for selection.
  4. **1-Click Manifest Generation:** Once the Master B/L is verified, clicking a single button generates the **Customs Cargo Manifest** with all aggregated line items.

---

### ④ Vessel / Fleet Directory Simplification
* **Remove:** 
  * "Active Voyage Schedules"
  * "Operational Status" tracking
  * Bahamas route defaults (e.g., Nassau Container Port, Bahama Express)
* **Retain:** 
  * A clean, simple **Vessel Directory / Fleet Directory** where the client can add and maintain the small vessels they service in the Eastern Caribbean.

---

### ⑤ Equipment / Container Fleet Removal
* **Client Request:** Remove the **Container Fleet / Equipment Management** module completely.
* **Reason:** As an NVOCC, they do not own or track container assets. They simply receive empty containers from ocean carriers (VOCC), pack cargo, record the container & seal numbers on the B/L, and ship them out.

---

### ⑥ Complete System Data Reset (Fresh Start)
* **Client Request:** *"Please if you can clear the entire program I would appreciate it... Let’s start fresh with the software then I can do the testing."*
* **Action Required:** 
  * Clear all dummy/seed records (dummy Bahama vessels, test receipts, fake containers, voyage logs).
  * Provide a clean database state ready for client testing with actual vessels and customer accounts.

---

## 4. Developer Implementation Checklist

- [ ] **Data Model & UI:** Merge Customer and Consignee into a single flexible `Customer` directory without rigid role locks.
- [ ] **Bug Fix:** Prevent auto-changing the customer profile when selecting an importer in receipt/B/L intake forms.
- [ ] **Consolidation Flow:** Add Consolidation Number selector on Master B/L creation modal/page to multi-select related HBLs.
- [ ] **1-Click Manifest:** Add a direct "Generate Manifest from Master B/L" button on the MBL screen.
- [ ] **Navigation & Modules:**
  - [ ] Remove `ContainersList` (Container Fleet) from the navigation bar.
  - [ ] Simplify `VesselsList` to only display the Fleet Directory (hide/remove Voyage Scheduler and live status widgets).
- [ ] **Print Layout:** Redesign the Bill of Lading printable document view to fill 100% of the page with standard maritime grid lines.
- [ ] **Database Wipe / Clean Seed:** Provide a reset script to wipe test data and prepare fresh system for Eastern Caribbean data entry.
