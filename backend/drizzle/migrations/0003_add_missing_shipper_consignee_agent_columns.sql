-- Add missing shipper_id and consignee_id columns to bills_of_lading, house_bills, and warehouse_receipts
ALTER TABLE "bills_of_lading" ADD COLUMN IF NOT EXISTS "shipper_id" uuid REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "bills_of_lading" ADD COLUMN IF NOT EXISTS "consignee_id" uuid REFERENCES "customers"("id");--> statement-breakpoint

ALTER TABLE "house_bills" ADD COLUMN IF NOT EXISTS "shipper_id" uuid REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "house_bills" ADD COLUMN IF NOT EXISTS "consignee_id" uuid REFERENCES "customers"("id");--> statement-breakpoint

ALTER TABLE "warehouse_receipts" ADD COLUMN IF NOT EXISTS "shipper_id" uuid REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "warehouse_receipts" ADD COLUMN IF NOT EXISTS "consignee_id" uuid REFERENCES "customers"("id");--> statement-breakpoint

-- Add missing agent_id and agent_name columns to cargo
ALTER TABLE "cargo" ADD COLUMN IF NOT EXISTS "agent_id" uuid REFERENCES "agents"("id");--> statement-breakpoint
ALTER TABLE "cargo" ADD COLUMN IF NOT EXISTS "agent_name" text;
