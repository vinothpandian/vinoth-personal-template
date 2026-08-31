CREATE TABLE "personal_template_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_template_app_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_template_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "personal_template_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "personal_template_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "personal_template_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "personal_template_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_template_account" ADD CONSTRAINT "personal_template_account_user_id_personal_template_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."personal_template_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_template_session" ADD CONSTRAINT "personal_template_session_user_id_personal_template_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."personal_template_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personal_template_account_user_id_idx" ON "personal_template_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "personal_template_session_user_id_idx" ON "personal_template_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "personal_template_verification_identifier_idx" ON "personal_template_verification" USING btree ("identifier");