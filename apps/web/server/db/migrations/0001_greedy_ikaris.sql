CREATE TABLE "transcriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_id" uuid,
	"content" text NOT NULL,
	"vtt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transcriptions" ADD CONSTRAINT "transcriptions_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;