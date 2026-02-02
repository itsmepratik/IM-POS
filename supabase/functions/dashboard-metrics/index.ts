import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Auth Context & Client Init
    // Initialize Supabase Client with Auth context forward
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop(); 
    
    let payload = {};
    if (req.method === 'POST') {
        try { payload = await req.json(); } catch (e) {}
    }
    const { startDate, endDate, shopId } = payload;

    let data;

    // 3. Route Dispatcher - Using RPCs via Supabase Client
    // This leverages the Data API (PostgREST) which is reliable and handles connection pooling.
    switch (path) {
      case 'revenue':
        const { data: revData, error: revError } = await supabaseClient.rpc('get_net_revenue', {
            start_date: startDate,
            end_date: endDate,
            filter_shop_id: shopId || null
        });
        if (revError) throw revError;
        // RPC returns numeric/string, ensure format
        data = Number(revData) || 0;
        break;

      case 'sales-trend':
        const { data: trendData, error: trendError } = await supabaseClient.rpc('get_daily_sales', {
            start_date: startDate,
            end_date: endDate,
            filter_shop_id: shopId || null
        });
        if (trendError) throw trendError;
        data = trendData;
        break;

      case 'payment-types':
         // get_daily_payment_metrics queries a specific date, but we want "Today" usually.
         // If dates provided, we might need a range. But the existing RPC is designed for a single day.
         // Let's assume the frontend passes today's date or we default to now.
         // Actually, let's use the 'current_date' logic if no date passed, or just pass payload.startDate if it's a specific day.
         // Wait, the client sends a range. But `get_daily_payment_metrics` takes `query_date`.
         // We will trigger it for 'Today' (end date) effectively as per existing dashboard logic.
        const queryDate = endDate || new Date().toISOString();
        const { data: payData, error: payError } = await supabaseClient.rpc('get_daily_payment_metrics', {
            query_date: queryDate,
            target_shop_id: shopId || null
        });
        if (payError) throw payError;
        data = payData;
        break;

      case 'top-items':
        const { data: topData, error: topError } = await supabaseClient.rpc('get_dashboard_top_items', {
            start_date: startDate,
            end_date: endDate,
            filter_shop_id: shopId || null
        });
        if (topError) throw topError;
        data = topData;
        break;

      case 'profits-card':
         const { data: profData, error: profError } = await supabaseClient.rpc('get_dashboard_profits_estimate', {
            start_date: startDate,
            end_date: endDate,
            filter_shop_id: shopId || null
         });
         if (profError) throw profError;
         data = Number(profData) || 0;
         break;

      case 'transaction-count':
        // Count transactions directly
        let query = supabaseClient
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .in('type', ['SALE', 'ON_HOLD_PAID', 'CREDIT_PAID']);
        
        if (shopId) {
            query = query.eq('shop_id', shopId); 
        }

        const { count, error: txError } = await query;
        if (txError) throw txError;
        data = count || 0;
        break;

      default:
        if (!path || path === 'dashboard-metrics') {
             return new Response(JSON.stringify({ status: "ok" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }
        throw new Error(`Unknown metric endpoint: ${path}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Edge Funtion Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
