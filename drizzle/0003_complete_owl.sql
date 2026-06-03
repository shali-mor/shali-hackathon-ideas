ALTER TABLE "submissions" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "category" SET DEFAULT 'other'::text;--> statement-breakpoint
-- Old taxonomy values aren't part of the new SDLC enum. Reset to 'other' so the
-- cast below succeeds; the backfill script re-guesses an SDLC stage afterwards.
UPDATE "submissions" SET "category" = 'other'
  WHERE "category" NOT IN ('planning','design','development','testing','deployment','maintenance','other');--> statement-breakpoint
DROP TYPE "public"."submission_category";--> statement-breakpoint
CREATE TYPE "public"."submission_category" AS ENUM('planning', 'design', 'development', 'testing', 'deployment', 'maintenance', 'other');--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "category" SET DEFAULT 'other'::"public"."submission_category";--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "category" SET DATA TYPE "public"."submission_category" USING "category"::"public"."submission_category";--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "category_other" text;