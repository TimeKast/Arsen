ALTER TABLE "budgets" DROP CONSTRAINT "budgets_company_id_area_id_concept_id_year_month_unique";--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_company_id_area_id_project_id_concept_id_year_month_unique" UNIQUE("company_id","area_id","project_id","concept_id","year","month");