-- Add columns for shop-specific bill header details
ALTER TABLE "public"."shops" 
ADD COLUMN IF NOT EXISTS "company_name" TEXT,
ADD COLUMN IF NOT EXISTS "company_name_arabic" TEXT,
ADD COLUMN IF NOT EXISTS "cr_number" TEXT,
ADD COLUMN IF NOT EXISTS "address_line_1" TEXT,
ADD COLUMN IF NOT EXISTS "address_line_2" TEXT,
ADD COLUMN IF NOT EXISTS "address_line_3" TEXT,
ADD COLUMN IF NOT EXISTS "contact_number" TEXT;

-- Add comment to explain usage
COMMENT ON COLUMN "public"."shops"."company_name" IS 'Shop-specific company name for bill header';
COMMENT ON COLUMN "public"."shops"."company_name_arabic" IS 'Shop-specific arabic company name for bill header';
