-- Create reference_number_counters table for sequential bill numbering
CREATE TABLE IF NOT EXISTS "reference_number_counters" (
	"prefix" text PRIMARY KEY NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Initialize counters for all prefixes starting at 0
INSERT INTO "reference_number_counters" ("prefix", "counter") VALUES
	('OH', 0),
	('CR', 0),
	('A', 0),
	('B', 0),
	('WBX', 0)
ON CONFLICT ("prefix") DO NOTHING;

