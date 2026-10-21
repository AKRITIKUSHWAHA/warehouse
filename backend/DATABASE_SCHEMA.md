# VI Customs Brokers & Logistics — Database Schema Reference

> **Database:** PostgreSQL 18  
> **ORM:** Drizzle ORM (`drizzle-orm/pg-core`)  
> **Migrations Directory:** `backend/drizzle/migrations/`  
> **Initial Migration:** `0000_lethal_mach_iv.sql`  

---

## 🏗️ Entity Relationship Overview

```text
[customers] ──(1:N)──> [warehouse_receipts] ──(1:N)──> [cargo]
                                 │
                               (M:N)
                                 ▼
                         [house_bills]
                                 │
                               (M:N)
                                 ▼
                       [consolidations] ──(N:1)──> [containers]
                                 │              └─> [vessels] / [voyages]
                               (1:1)
                                 ▼
                          [shipments]
                         /           \
                     (1:1)           (1:N)
                      ▼               ▼
             [bills_of_lading]   [manifests]
```

---

## 📋 Comprehensive Tables Catalog (20 Tables)

### 1. `users`
System user accounts for staff and destination port agents.
- `id` (UUID, PK, `gen_random_uuid()`)
- `user_code` (TEXT, UNIQUE) — e.g. `'USR-001'`
- `email` (TEXT, NOT NULL, UNIQUE)
- `password_hash` (TEXT, NOT NULL) — bcrypt hashed
- `name` (TEXT, NOT NULL)
- `role_key` (TEXT, NOT NULL) — References `roles.role_key` (`super_admin` | `operations` | `documentation` | `agent`)
- `department` (TEXT)
- `status` (TEXT, DEFAULT `'Active'`, NOT NULL)
- `avatar` (TEXT)
- `last_login` (TEXT)
- `phone` (TEXT)
- `agent_id` (UUID, REFERENCES `agents.id`, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 2. `roles`
Role definitions and permission assignments.
- `id` (UUID, PK)
- `role_key` (TEXT, NOT NULL, UNIQUE) — e.g. `'super_admin'`, `'documentation'`, `'operations'`, `'agent'`
- `role_name` (TEXT, NOT NULL)
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 3. `ports`
Master maritime port terminals across Florida & the Caribbean.
- `id` (UUID, PK)
- `port_code` (TEXT, NOT NULL, UNIQUE) — e.g. `'NAS'`, `'FPO'`, `'MIA'`, `'KIN'`, `'BGI'`
- `name` (TEXT, NOT NULL) — e.g. `'Nassau Container Port (Arawak Cay)'`
- `island` (TEXT)
- `country` (TEXT, NOT NULL)
- `status` (TEXT, DEFAULT `'Active'`, NOT NULL)
- `default_agent` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 4. `settings`
System-wide configuration, company profiles, and document numbering sequence rules.
- `id` (UUID, PK)
- `key` (TEXT, NOT NULL, UNIQUE) — e.g. `'numberingRules'`
- `value` (JSONB, NOT NULL) — Contains prefix rules:
  ```json
  {
    "warehouseReceiptPrefix": "WR-2026-",
    "billOfLadingPrefix": "BL-VI-2026-",
    "shipmentPrefix": "SHP-2026-",
    "consolidationPrefix": "CNS-2026-",
    "manifestPrefix": "MNF-2026-"
  }
  ```
- `description` (TEXT)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 5. `agents`
Destination port partner agencies (e.g. Caribbean Express Freight Ltd.).
- `id` (UUID, PK)
- `agent_code` (TEXT, NOT NULL, UNIQUE) — e.g. `'AGT-001'`
- `name` (TEXT, NOT NULL)
- `contact_person` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `territory` (TEXT)
- `address` (TEXT)
- `assigned_port_code` (TEXT) — Links to `ports.port_code` (e.g. `'NAS'`)
- `status` (TEXT, DEFAULT `'Active'`, NOT NULL)
- `rating` (TEXT, DEFAULT `'5.0/5'`)
- `credit_limit_usd` (NUMERIC(12,2), DEFAULT `0.00`)
- `current_balance_usd` (NUMERIC(12,2), DEFAULT `0.00`)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 6. `customers`
Commercial and personal freight customers (act as shippers and/or consignees).
- `id` (UUID, PK)
- `customer_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'CUS-2026-0001'`
- `name` (TEXT, NOT NULL)
- `company_name` (TEXT)
- `contact_person` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `destination_port` (TEXT)
- `destination_code` (TEXT) — Links to port code e.g. `'NAS'`
- `tax_id` (TEXT) — e.g. `'TIN-BS-994821'`
- `account_type` (TEXT, DEFAULT `'Commercial Customer'`)
- `credit_terms` (TEXT, DEFAULT `'Net 30'`)
- `status` (TEXT, DEFAULT `'Active'`, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 7. `warehouse_receipts`
Physical intake records generated upon cargo arrival at the Miami CFS terminal.
- `id` (UUID, PK)
- `receipt_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'WR-2026-1041'`
- `date` (TEXT, NOT NULL)
- `time` (TEXT)
- `customer_id` (UUID, REFERENCES `customers.id`)
- `customer_name` (TEXT, NOT NULL)
- `shipper` (TEXT)
- `consignee` (TEXT)
- `destination_port` (TEXT, NOT NULL)
- `destination_code` (TEXT, NOT NULL) — e.g. `'NAS'`
- `cargo_description` (TEXT)
- `package_count` (INTEGER, DEFAULT 0, NOT NULL)
- `total_pieces` (INTEGER, DEFAULT 0, NOT NULL)
- `total_weight_lbs` (NUMERIC(10,2), DEFAULT `0.00`)
- `total_cft` (NUMERIC(10,2), DEFAULT `0.00`)
- `total_cbm` (NUMERIC(10,2), DEFAULT `0.00`)
- `packages` (JSONB) — Package breakdown rows with dimensions, weights, and individual CFT/CBM
- `status` (TEXT, DEFAULT `'Draft'`, NOT NULL) — `'Draft'` | `'Ready for Consolidation'` | `'Consolidated'`
- `agent_id` (UUID, REFERENCES `agents.id`, NULLABLE)
- `created_by` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 8. `cargo`
Individual package-level cargo lines tracked in warehouse staging bays.
- `id` (UUID, PK)
- `warehouse_receipt_id` (UUID, REFERENCES `warehouse_receipts.id`, NOT NULL)
- `receipt_number` (TEXT, NOT NULL)
- `customer_name` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `package_type` (TEXT, DEFAULT `'Carton'`)
- `pieces` (INTEGER, DEFAULT 1)
- `length_inches` (NUMERIC(8,2))
- `width_inches` (NUMERIC(8,2))
- `height_inches` (NUMERIC(8,2))
- `weight_lbs` (NUMERIC(10,2))
- `cft` (NUMERIC(10,2))
- `cbm` (NUMERIC(10,2))
- `warehouse_location` (TEXT, DEFAULT `'Bay A-01'`)
- `destination_code` (TEXT, NOT NULL)
- `status` (TEXT, DEFAULT `'Ready for Consolidation'`, NOT NULL)
- `barcode` (TEXT)
- `qr_code` (TEXT)
- `assigned_consolidation_id` (UUID, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 9. `house_bills`
House Bills of Lading (HBL) issued to individual shippers/customers.
- `id` (UUID, PK)
- `hbl_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'HBL-2026-0001'`
- `customer_id` (UUID, REFERENCES `customers.id`, NOT NULL)
- `customer_name` (TEXT, NOT NULL)
- `shipper` (JSONB, NOT NULL) — `{ name, address, contact }`
- `consignee` (JSONB, NOT NULL) — `{ name, address, taxId, contact }`
- `notify_party` (JSONB)
- `agent_id` (UUID, REFERENCES `agents.id`, NULLABLE)
- `agent_name` (TEXT)
- `place_of_receipt` (TEXT, DEFAULT `'Miami CFS Terminal'`)
- `port_of_loading` (TEXT, DEFAULT `'Port of Miami (USMIA)'`)
- `port_of_discharge` (TEXT, NOT NULL) — e.g. `'Nassau Container Port (BSNAS)'`
- `final_destination` (TEXT)
- `warehouse_receipt_ids` (JSONB, NOT NULL) — Array of linked WR UUIDs
- `total_pieces` (INTEGER, NOT NULL)
- `total_weight_lbs` (NUMERIC(10,2), NOT NULL)
- `total_cbm` (NUMERIC(10,2), NOT NULL)
- `status` (TEXT, DEFAULT `'Issued'`, NOT NULL) — `'Draft'` | `'Issued'` | `'Consolidated'` | `'Delivered'`
- `consolidation_id` (UUID, NULLABLE)
- `master_bl_id` (UUID, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 10. `consolidations`
Ocean container packing sessions combining multiple House B/Ls for a single destination port.
- `id` (UUID, PK)
- `consolidation_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'CNS-2026-0817'`
- `title` (TEXT, NOT NULL)
- `destination_port` (TEXT, NOT NULL)
- `destination_code` (TEXT, NOT NULL)
- `container_number` (TEXT, NOT NULL) — e.g. `'MSKU-948291-4'`
- `container_type` (TEXT, DEFAULT `'40 HC'`)
- `container_capacity_cbm` (NUMERIC(8,2), DEFAULT `76.20`)
- `seal_number` (TEXT, NOT NULL)
- `vessel_name` (TEXT, NOT NULL)
- `voyage_number` (TEXT, NOT NULL)
- `carrier` (TEXT, NOT NULL)
- `house_bill_ids` (JSONB, NOT NULL) — Array of packed HBL UUIDs
- `total_cbm` (NUMERIC(10,2), NOT NULL)
- `total_weight_lbs` (NUMERIC(10,2), NOT NULL)
- `fill_percentage` (NUMERIC(5,2), NOT NULL)
- `status` (TEXT, DEFAULT `'Planning'`, NOT NULL) — `'Planning'` | `'Loading'` | `'Finalized'` | `'Departed'`
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 11. `containers`
Equipment fleet inventory (20' GP, 40' GP, 40' HC).
- `id` (UUID, PK)
- `container_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'MSKU-948291-4'`
- `type` (TEXT, NOT NULL)
- `carrier` (TEXT)
- `seal_number` (TEXT)
- `tare_weight_kg` (NUMERIC(8,2))
- `max_payload_kg` (NUMERIC(8,2))
- `max_volume_cbm` (NUMERIC(8,2))
- `status` (TEXT, DEFAULT `'Available'`, NOT NULL) — `'Available'` | `'Staged'` | `'Loaded'` | `'In Transit'`
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 12. `vessels` & 13. `voyages`
Commercial carrier vessels and scheduled liner voyage rotations.
- **`vessels`:** `id`, `name`, `imo_number`, `flag`, `carrier`, `capacity_teu`, `status`, `created_at`
- **`voyages`:** `id`, `voyage_number`, `vessel_id` (FK), `carrier`, `origin_port`, `destination_port`, `etd`, `eta`, `status`

---

### 14. `shipments`
Master multimodal cargo consignments connecting consolidated containers to transit tracking.
- `id` (UUID, PK)
- `shipment_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'SHP-2026-0290'`
- `tracking_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'TRK-VI-994821'`
- `type` (TEXT, DEFAULT `'Ocean LCL Consolidation'`)
- `status` (TEXT, DEFAULT `'Booked'`, NOT NULL) — `'Booked'` | `'In Transit'` | `'Arrived'` | `'Delivered'`
- `origin` (TEXT, NOT NULL)
- `destination_port` (TEXT, NOT NULL)
- `destination_code` (TEXT, NOT NULL)
- `vessel_name` (TEXT)
- `voyage_number` (TEXT)
- `container_number` (TEXT)
- `seal_number` (TEXT)
- `bill_of_lading_id` (UUID, NULLABLE)
- `bill_of_lading_number` (TEXT)
- `bl_status` (TEXT, DEFAULT `'Draft'`) — `'Draft'` | `'Issued'` | `'On Hold'` | `'Released'`
- `manifest_number` (TEXT)
- `etd` (TEXT)
- `eta` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 15. `bills_of_lading`
Master Ocean Bills of Lading governing custody and cargo delivery release.
- `id` (UUID, PK)
- `bl_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'BL-VI-2026-0092'`
- `type` (TEXT, DEFAULT `'Master Ocean Bill of Lading'`)
- `status` (TEXT, DEFAULT `'Draft'`, NOT NULL) — `'Draft'` | `'Issued'` | `'On Hold'` | `'Released'`
- `shipment_id` (UUID, REFERENCES `shipments.id`, NULLABLE)
- `shipment_number` (TEXT)
- `consolidation_id` (UUID, REFERENCES `consolidations.id`, NULLABLE)
- `shipper` (JSONB, NOT NULL)
- `consignee` (JSONB, NOT NULL)
- `notify_party` (JSONB)
- `agent_id` (UUID, REFERENCES `agents.id`, NULLABLE)
- `port_of_loading` (TEXT, NOT NULL)
- `port_of_discharge` (TEXT, NOT NULL)
- `ocean_vessel` (TEXT)
- `voyage_number` (TEXT)
- `container_number` (TEXT)
- `seal_number` (TEXT)
- `total_packages` (INTEGER)
- `total_weight_lbs` (NUMERIC(10,2))
- `total_cbm` (NUMERIC(10,2))
- `freight_terms` (TEXT, DEFAULT `'Prepaid'`)
- `hold_details` (JSONB, DEFAULT `'{"isOnHold": false}'`) — `{ isOnHold: boolean, reason?: string, placedBy?: string, placedAt?: string }`
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 16. `manifests`
Customs-compliant shipping manifests for port authority filings.
- `id` (UUID, PK)
- `manifest_number` (TEXT, NOT NULL, UNIQUE) — e.g. `'MNF-2026-0441'`
- `vessel_name` (TEXT, NOT NULL)
- `voyage_number` (TEXT, NOT NULL)
- `carrier` (TEXT, NOT NULL)
- `port_of_loading` (TEXT, NOT NULL)
- `port_of_discharge` (TEXT, NOT NULL)
- `departure_date` (TEXT)
- `arrival_date` (TEXT)
- `total_bls` (INTEGER, DEFAULT 1)
- `total_house_bills` (INTEGER, DEFAULT 1)
- `total_containers` (INTEGER, DEFAULT 1)
- `total_packages` (INTEGER)
- `total_weight_lbs` (NUMERIC(10,2))
- `total_cbm` (NUMERIC(10,2))
- `items` (JSONB, NOT NULL) — Array of manifest line items with HBL reference, shipper, consignee, package type, weight, and volume
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 17. `documents`
File attachments (commercial invoices, packing slips, clearance certifications).
- `id` (UUID, PK)
- `document_name` (TEXT, NOT NULL)
- `document_type` (TEXT, NOT NULL)
- `entity_type` (TEXT, NOT NULL) — `'WAREHOUSE_RECEIPT'` | `'HOUSE_BILL'` | `'SHIPMENT'` | `'MASTER_BL'`
- `entity_id` (UUID, NOT NULL)
- `file_path` (TEXT, NOT NULL)
- `file_size_bytes` (INTEGER)
- `mime_type` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 18. `tracking_events`
Milestone progression timeline for shipments.
- `id` (UUID, PK)
- `shipment_id` (UUID, REFERENCES `shipments.id`, NOT NULL)
- `stage` (TEXT, NOT NULL) — e.g. `'Cargo Received CFS'`, `'Container Stuffed'`, `'Vessel Departed'`
- `location` (TEXT)
- `date` (TEXT, NOT NULL)
- `time` (TEXT)
- `status` (TEXT, DEFAULT `'Pending'`) — `'Completed'` | `'Active'` | `'Pending'`
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 19. `audit_logs`
Immutable audit trail capturing all system modifications, logins, and hold/release actions.
- `id` (UUID, PK)
- `user_id` (UUID, NULLABLE)
- `user_name` (TEXT, NOT NULL)
- `module` (TEXT, NOT NULL)
- `action` (TEXT, NOT NULL) — e.g. `'Placed B/L On Hold'`, `'Released B/L'`, `'Generated Manifest'`
- `record_id` (TEXT)
- `description` (TEXT, NOT NULL)
- `ip_address` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)

---

### 20. `permissions`
Granular feature flags assigned to roles.
- `id` (UUID, PK)
- `role_key` (TEXT, REFERENCES `roles.role_key`, NOT NULL)
- `permission_key` (TEXT, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
