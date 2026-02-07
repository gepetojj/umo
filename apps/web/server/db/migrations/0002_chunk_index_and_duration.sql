ALTER TABLE "objects" ADD COLUMN "chunk_index" integer;--> statement-breakpoint
ALTER TABLE "transcriptions" ADD COLUMN "chunk_index" integer;--> statement-breakpoint
ALTER TABLE "transcriptions" ADD COLUMN "chunk_duration_ms" integer;