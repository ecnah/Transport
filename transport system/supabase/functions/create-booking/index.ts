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

    const body = await req.json();
    const {
      full_name,
      phone,
      email,
      package_id,
      package_name,
      destination_id,
      travel_date,
      return_date,
      adults = 1,
      children = 0,
      accommodation,
      transport,
      airport_service,
      special_requests
    } = body;

    // 1. Validate required fields
    if (!full_name || !phone || !email || !travel_date) {
      return new Response(
        JSON.stringify({ error: "Missing required booking fields (Full Name, Phone, Email, Travel Date)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find or create customer
    let { data: customer } = await supabaseClient
      .from("customers")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: custErr } = await supabaseClient
        .from("customers")
        .insert([{ full_name, email, phone }])
        .select()
        .maybeSingle();
      if (custErr) throw custErr;
      customer = newCustomer;
    }

    // 3. Fetch package pricing details (Safe UUID check)
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(package_id || "");
    let pkg = null;

    if (isUuid) {
      const { data: foundPkg } = await supabaseClient
        .from("safari_packages")
        .select("*")
        .eq("id", package_id)
        .maybeSingle();
      pkg = foundPkg;
    }

    // Fallback pricing if package is non-UUID seed or custom
    const adultPrice = pkg ? (pkg.price || 0) : (body.total_amount ? Math.round(body.total_amount / (adults + (children * 0.5))) : 45000);
    const childPrice = pkg ? (pkg.price_child || Math.round(adultPrice * 0.5)) : Math.round(adultPrice * 0.5);

    // Calculate Airport Service Fee
    let airportFee = 0;
    const apService = airport_service || "No Airport Transfer";
    if (apService.includes('3,000')) airportFee = 3000;
    else if (apService.includes('5,500')) airportFee = 5500;
    else if (apService.includes('2,500')) airportFee = 2500;
    else if (apService.includes('8,000')) airportFee = 8000;

    const numAdults = parseInt(adults || 1);
    const numChildren = parseInt(children || 0);

    const subtotal = (numAdults * adultPrice) + (numChildren * childPrice) + airportFee;
    const discount = 0;
    const totalAmount = body.total_amount || (subtotal - discount);

    // 4. Generate Booking Reference: CYR-YYYY-XXXX
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const booking_reference = `CYR-${year}-${randomSeq}`;

    // 5. Insert Booking
    const bookingRecord: any = {
      booking_reference,
      customer_id: customer?.id || null,
      package_id: isUuid ? package_id : null,
      destination_id: (destination_id && /^[0-9a-fA-F-]{36}$/.test(destination_id)) ? destination_id : null,
      travel_date,
      return_date: return_date || travel_date,
      adults: numAdults,
      children: numChildren,
      accommodation: accommodation || "Standard Safari Lodge",
      transport: transport || "4x4 Safari Landcruiser",
      airport_service: apService,
      special_requests: special_requests || "",
      subtotal,
      discount,
      total_amount: totalAmount,
      amount_paid: 0,
      balance: totalAmount,
      payment_status: "Unpaid",
      booking_status: "Pending"
    };

    const { data: booking, error: bookErr } = await supabaseClient
      .from("bookings")
      .insert([bookingRecord])
      .select()
      .single();

    if (bookErr) throw bookErr;

    // 6. Generate Invoice
    const invoiceNumber = `INV-${year}-${randomSeq}`;
    const { data: invoice } = await supabaseClient
      .from("invoices")
      .insert([{
        invoice_number: invoiceNumber,
        booking_id: booking.id,
        customer_name: full_name,
        customer_phone: phone,
        customer_email: email,
        subtotal,
        discount,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        payment_status: "Unpaid",
        invoice_date: new Date().toISOString().split("T")[0]
      }])
      .select()
      .maybeSingle();

    // 7. Dispatch WhatsApp Admin Notification
    try {
      const whatsappToken = Deno.env.get("WHATSAPP_CLOUD_API_TOKEN");
      const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_ID");
      const adminPhone = Deno.env.get("ADMIN_WHATSAPP_NUMBER") || "254726072607";

      if (whatsappToken && whatsappPhoneId) {
        await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${whatsappToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: adminPhone,
            type: "text",
            text: {
              body: `*NEW SAFARI & AIRPORT BOOKING*\n\n` +
                    `Booking ID: ${booking.booking_reference}\n` +
                    `Customer: ${full_name}\n` +
                    `Phone: ${phone}\n` +
                    `Package: ${pkg ? pkg.name : (package_name || 'Safari Package')}\n` +
                    `Travel Date: ${travel_date}\n` +
                    `Travelers: ${numAdults} Adults, ${numChildren} Children\n` +
                    `Airport Service: ${apService}\n` +
                    `Total: KES ${totalAmount.toLocaleString()}\n` +
                    `Status: Pending\n\n` +
                    `Please login to the admin dashboard to review the booking.`
            }
          })
        });
      }
    } catch (e) {
      console.warn("WhatsApp dispatch notification warning:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking,
        invoice,
        message: "Booking submitted successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to create booking" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
