CREATE TABLE "judge_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"judge_email" text NOT NULL,
	"judge_name" text,
	"impact" integer NOT NULL,
	"demo" integer NOT NULL,
	"pitch" integer NOT NULL,
	"adoptability" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "judge_scores_judge_submission" UNIQUE("judge_email","submission_id")
);
--> statement-breakpoint
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;