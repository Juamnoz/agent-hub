ALTER TYPE "public"."agent_status" ADD VALUE 'testing';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "admin_phone" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "escalation_phone" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "trained_at" timestamp;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "conversation_examples" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;