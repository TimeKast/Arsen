CREATE TYPE "public"."result_source" AS ENUM('O', 'M');--> statement-breakpoint
ALTER TABLE "results" DROP CONSTRAINT "results_company_id_project_id_concept_id_year_month_unique";--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "source" "result_source" DEFAULT 'M' NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_company_id_project_id_concept_id_year_month_source_unique" UNIQUE("company_id","project_id","concept_id","year","month","source");