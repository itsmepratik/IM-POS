-- Add remaining columns for full bill customization
ALTER TABLE "public"."shops" 
ADD COLUMN IF NOT EXISTS "service_description_en" TEXT,
ADD COLUMN IF NOT EXISTS "service_description_ar" TEXT,
ADD COLUMN IF NOT EXISTS "thank_you_message" TEXT,
ADD COLUMN IF NOT EXISTS "brand_name" TEXT,
ADD COLUMN IF NOT EXISTS "brand_address" TEXT,
ADD COLUMN IF NOT EXISTS "brand_phones" TEXT,
ADD COLUMN IF NOT EXISTS "brand_whatsapp" TEXT;

COMMENT ON COLUMN "public"."shops"."service_description_en" IS 'Service description in English for bill';
COMMENT ON COLUMN "public"."shops"."service_description_ar" IS 'Service description in Arabic for bill';
COMMENT ON COLUMN "public"."shops"."thank_you_message" IS 'Footer thank you message';
