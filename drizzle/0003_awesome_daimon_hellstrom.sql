CREATE TABLE "trade_in_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"size" text NOT NULL,
	"condition" text NOT NULL,
	"trade_in_value" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
