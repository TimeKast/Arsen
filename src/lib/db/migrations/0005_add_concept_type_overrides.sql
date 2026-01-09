CREATE TABLE "concept_type_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"concept_name" varchar(255) NOT NULL,
	"concept_type" "concept_type" DEFAULT 'INCOME' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "concept_type_overrides_company_id_concept_name_unique" UNIQUE("company_id","concept_name")
);
--> statement-breakpoint
ALTER TABLE "concept_type_overrides" ADD CONSTRAINT "concept_type_overrides_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_type_overrides" ADD CONSTRAINT "concept_type_overrides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;