CREATE TABLE "project_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"external_name" varchar(255) NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "business_unit" varchar(255);--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "account" varchar(255);--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "cancelled" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "in_transit" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "entries" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "withdrawals" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "balance" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "observations" text;--> statement-breakpoint
ALTER TABLE "project_mappings" ADD CONSTRAINT "project_mappings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_mappings" ADD CONSTRAINT "project_mappings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" DROP COLUMN "total";