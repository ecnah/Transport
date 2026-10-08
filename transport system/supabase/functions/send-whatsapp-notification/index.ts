// @ts-nocheck
declare const Deno: any;

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
    const body = await req.json();
    const {
      booking_reference,
      customer_name,
      phone,
      package_name,
      travel_date,
      total_amount,
      airport_service,
      recipient_number
    } = body;

    const whatsappToken = Deno.env.get("WHATSAPP_CLOUD_API_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_ID");
    const targetPhone = recipient_number || Deno.env.get("ADMIN_WHATSAPP_NUMBER") || "254726072607";

    const messageText = 
      `*NEW SAFARI & AIRPORT BOOKING*\n\n` +
      `Booking ID: ${booking_reference || 'N/A'}\n\n` +
      `Customer:\n${customer_name || 'Guest'}\n\n` +
      `Phone:\n${phone || 'N/A'}\n\n` +
      `Package:\n${package_name || 'Safari Package'}\n\n` +
      `Travel Date:\n${travel_date || 'N/A'}\n\n` +
      `Airport Service:\n${airport_service || 'No Airport Transfer'}\n\n` +
      `Total:\nKES ${Number(total_amount || 0).toLocaleString()}\n\n` +
      `Status:\nPending\n\n` +
      `Please login to the admin dashboard to review the booking.`;

    if (!whatsappToken || !whatsappPhoneId) {
      // Simulation mode when API credentials are not yet configured in environment variables
      return new Response(
        JSON.stringify({ 
          success: true, 
          simulated: true, 
          messageText, 
          notice: "WhatsApp Cloud API credentials not set in secrets. Simulated notification generated successfully." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whatsappToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: targetPhone,
        type: "text",
        text: { body: messageText }
      })
    });

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, api_response: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to dispatch WhatsApp notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
