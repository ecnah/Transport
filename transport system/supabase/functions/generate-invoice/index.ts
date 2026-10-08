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
    const { booking } = await req.json();

    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${(booking?.booking_reference || '').replace(/[^0-9]/g, '').slice(-4) || '1001'}`;

    const invoiceData = {
      invoice_number: invoiceNumber,
      company: {
        name: "CYROO TOURS & SAFARI",
        tagline: "Explore Kenya. Experience the Wild.",
        phone: "0726072607 / 0733185018",
        email: "cyrootourssafari@gmail.com",
        location: "Nairobi, Kenya"
      },
      customer: {
        name: booking?.customer_name,
        phone: booking?.customer_phone,
        email: booking?.customer_email
      },
      itinerary: {
        package_name: booking?.package_name,
        destination: booking?.destination,
        travel_date: booking?.travel_date,
        return_date: booking?.return_date,
        adults: booking?.adults,
        children: booking?.children,
        accommodation: booking?.accommodation,
        transport: booking?.transport,
        airport_service: booking?.airport_service
      },
      financials: {
        subtotal: booking?.total_amount,
        discount: 0,
        total_amount: booking?.total_amount,
        amount_paid: booking?.amount_paid || 0,
        balance_due: booking?.balance || booking?.total_amount
      }
    };

    return new Response(
      JSON.stringify({ success: true, invoice: invoiceData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to generate invoice data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
