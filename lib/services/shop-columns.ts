/**
 * Columns of `public.shops` readable by the browser (authenticated role).
 *
 * `supervisor_password_hash` is deliberately excluded: the column-level grant
 * in migration 20261031000001 revokes it from client roles, so `select("*")`
 * on shops from the browser fails. Always select through this list.
 *
 * Kept as a single string literal so supabase-js can infer the row type.
 */
export const SHOP_PUBLIC_COLUMNS =
  "id, name, display_name, location_id, is_active, pos_id, shop_code, zip_code, company_name, company_name_arabic, cr_number, address_line_1, address_line_2, address_line_3, address_line_arabic_1, address_line_arabic_2, contact_number, contact_number_arabic, service_description_en, service_description_ar, thank_you_message, thank_you_message_ar, brand_name, brand_address, brand_phones, brand_whatsapp, created_at, updated_at" as const;
