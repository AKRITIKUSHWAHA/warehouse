-- Drop containers and voyages tables
DROP TABLE IF EXISTS "containers" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "voyages" CASCADE;--> statement-breakpoint

-- Simplify vessels table into Fleet Directory (Name, Type/Classification, Carrier, Notes)
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "imo_number";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "flag";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "capacity_teu";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "deadweight_tonnage";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "built_year";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "current_voyage";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "active_route";--> statement-breakpoint
ALTER TABLE "vessels" DROP COLUMN IF EXISTS "eta_next_port";--> statement-breakpoint
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "notes" text;--> statement-breakpoint

-- Simplify consolidations table (remove voyage & container inventory features)
ALTER TABLE "consolidations" DROP COLUMN IF EXISTS "container_id";--> statement-breakpoint
ALTER TABLE "consolidations" DROP COLUMN IF EXISTS "container_capacity_cbm";--> statement-breakpoint
ALTER TABLE "consolidations" DROP COLUMN IF EXISTS "container_fill_percentage";--> statement-breakpoint
ALTER TABLE "consolidations" DROP COLUMN IF EXISTS "voyage_id";--> statement-breakpoint
ALTER TABLE "consolidations" DROP COLUMN IF EXISTS "voyage_number";--> statement-breakpoint

-- Remove voyage_number from bills of lading, manifests, and shipments
ALTER TABLE "bills_of_lading" DROP COLUMN IF EXISTS "voyage_number";--> statement-breakpoint
ALTER TABLE "manifests" DROP COLUMN IF EXISTS "voyage_number";--> statement-breakpoint
ALTER TABLE "shipments" DROP COLUMN IF EXISTS "voyage_number";
