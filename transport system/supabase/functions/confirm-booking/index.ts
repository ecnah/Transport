// @ts-nocheck
declare const Deno: any;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Deno Native HTTP Server
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const { booking_id, booking_status, payment_status } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "Missing booking_id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updateData: any = {};
    if (booking_status) updateData.booking_status = booking_status;
    if (payment_status) updateData.payment_status = payment_status;

    const { data: updatedBooking, error } = await supabaseClient
      .from("bookings")
      .update(updateData)
      .eq("id", booking_id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, booking: updatedBooking }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to confirm booking" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
