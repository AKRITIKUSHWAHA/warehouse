ALTER TABLE "customers" ALTER COLUMN "account_type" SET DEFAULT 'Commercial Customer';--> statement-breakpoint
ALTER TABLE "cargo" ALTER COLUMN "warehouse_receipt_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cargo" ALTER COLUMN "receipt_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cargo" ADD COLUMN "agent_id" uuid;--> statement-breakpoint
ALTER TABLE "cargo" ADD COLUMN "agent_name" text;--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "agent_id" text;--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "agent_name" text;