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
    const { booking_reference, customer_name, customer_email, package_name, travel_date, total_amount } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          simulated: true, 
          notice: "RESEND_API_KEY not configured. Email confirmation simulated successfully." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Cyroo Tours & Safari <reservations@cyrootourssafari.com>",
        to: [customer_email],
        subject: `Safari Booking Confirmation - ${booking_reference}`,
        html: `
          <h2>Thank you for booking with Cyroo Tours & Safari!</h2>
          <p>Dear ${customer_name},</p>
          <p>We have received your booking request for <strong>${package_name}</strong> starting on <strong>${travel_date}</strong>.</p>
          <p><strong>Booking Reference:</strong> ${booking_reference}<br>
          <strong>Total Amount:</strong> KES ${Number(total_amount).toLocaleString()}</p>
          <p>Our team will contact you shortly to confirm your itinerary and payment instructions.</p>
          <p>Best regards,<br>Cyroo Tours & Safari Team<br>Phone: 0726072607 / 0733185018</p>
        `
      })
    });

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to dispatch email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
