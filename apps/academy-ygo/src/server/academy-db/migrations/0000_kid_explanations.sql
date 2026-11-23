CREATE TYPE "public"."explanation_status" AS ENUM('draft', 'checked');--> statement-breakpoint
CREATE TABLE "card_kid_explanations" (
	"passcode" integer NOT NULL,
	"locale" text NOT NULL,
	"text" text NOT NULL,
	"status" "explanation_status" DEFAULT 'draft' NOT NULL,
	"model" text,
	"prompt_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_kid_explanations_card_locale" UNIQUE("passcode","locale")
);
