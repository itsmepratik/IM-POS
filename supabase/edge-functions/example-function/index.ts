// Example Edge Function for the POS system
// This is a template for creating serverless functions

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestBody {
  message?: string;
  data?: any;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
  }

  try {
    // Get the request body
    const body: RequestBody = await req.json();

    // Process the request
    const response = {
      success: true,
      message: body.message || "Hello from Edge Function!",
      timestamp: new Date().toISOString(),
      data: body.data || null,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in edge function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
