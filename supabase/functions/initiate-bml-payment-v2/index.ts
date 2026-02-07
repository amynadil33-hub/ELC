import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    // Must have Authorization header (user session token from supabase-js)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Env
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const BML_API_URL = Deno.env.get("BML_API_URL");
    const BML_API_KEY = Deno.env.get("BML_API_KEY");
    const PAYMENT_REDIRECT_URL = Deno.env.get("PAYMENT_REDIRECT_URL");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY in function env" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!BML_API_URL || !BML_API_KEY || !PAYMENT_REDIRECT_URL) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing BML_API_URL / BML_API_KEY / PAYMENT_REDIRECT_URL secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Safe JSON parse
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      courseId,
      pricingId,
      tuitionAmount,
      registrationFee,
      totalAmount,
      currency = "MVR",
    } = body;

    if (!courseId || !pricingId || totalAmount == null) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing courseId/pricingId/totalAmount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create a Supabase client that uses the USER JWT (RLS-safe)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the token + get the real user id
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid session / JWT", details: userErr?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = userData.user.id;

    // 1) Insert payment record (use status 'pending' to match your existing manual flow)
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        course_id: courseId,
        pricing_id: pricingId,
        tuition_amount: tuitionAmount ?? null,
        registration_fee: registrationFee ?? null,
        total_amount: totalAmount,
        amount: totalAmount,
        currency,
        payment_method: "bml",
        status: "pending", // ✅ IMPORTANT (matches your existing enum/check)
      })
      .select("id")
      .single();

    if (insertError || !payment) {
      // Return the REAL DB error so you can see the constraint/enum problem if any
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create payment record",
          db: {
            message: insertError?.message ?? "unknown",
            details: (insertError as any)?.details ?? null,
            hint: (insertError as any)?.hint ?? null,
            code: (insertError as any)?.code ?? null,
          },
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Call BML to create transaction
    const amountInLaari = Math.round(Number(totalAmount) * 100);

    const bmlPayload = {
      amount: amountInLaari,
      currency,
      localId: payment.id, // ✅ key link between BML and your payments row
      redirectUrl: `${PAYMENT_REDIRECT_URL}?payment_id=${payment.id}`,
      customerReference: `ELC-${String(payment.id).slice(0, 8)}`,
    };

    const resp = await fetch(`${BML_API_URL.replace(/\/$/, "")}/public/v2/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": BML_API_KEY, // ✅ matches your working production project
      },
      body: JSON.stringify(bmlPayload),
    });

    const text = await resp.text();
    let bmlData: any = text;
    try { bmlData = JSON.parse(text); } catch {}

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "BML create transaction failed", bml: bmlData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const redirectUrl = bmlData?.shortUrl || bmlData?.url || bmlData?.redirectUrl || null;
    if (!redirectUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "BML did not return a redirect URL", bml: bmlData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, paymentId: payment.id, redirectUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
