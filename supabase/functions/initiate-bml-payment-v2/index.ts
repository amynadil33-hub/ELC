import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  try {
    // ---------------------------------------
    // CORS PRE-FLIGHT
    // ---------------------------------------
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------------------------------------
    // SAFE JSON PARSE
    // ---------------------------------------
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const courseId = body?.courseId ?? body?.course_id;
    const pricingId = body?.pricingId ?? body?.pricing_id ?? null;

    const amountRaw = body?.amount ?? body?.total_amount;
    const totalAmountMvr = Number(amountRaw);

    if (!courseId) {
      return new Response(JSON.stringify({ success: false, error: "Missing courseId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Number.isFinite(totalAmountMvr) || totalAmountMvr <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid amount", amountRaw }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------------------------------------
    // ENV VARS
    // ---------------------------------------
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const BML_API_URL = Deno.env.get("BML_API_URL")!;
    const BML_API_KEY = Deno.env.get("BML_API_KEY")!;
    const PAYMENT_REDIRECT_URL_RAW = Deno.env.get("PAYMENT_REDIRECT_URL")!;

    // Trim and validate redirect URL (BML is strict)
    const PAYMENT_REDIRECT_URL = (PAYMENT_REDIRECT_URL_RAW || "").trim();
    try {
      const u = new URL(PAYMENT_REDIRECT_URL);
      if (u.protocol !== "https:" && u.protocol !== "http:") {
        throw new Error("redirectUrl must be http/https");
      }
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid PAYMENT_REDIRECT_URL (must be a full URL)",
          value: PAYMENT_REDIRECT_URL,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------------------------------------
    // AUTH HEADER (FROM FRONTEND)
    // ---------------------------------------
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("Authorization") ||
      "";

    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Missing Bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------------------------------------
    // GET USER (AUTH API) — validates JWT
    // ---------------------------------------
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
      },
    });

    const userJson = await userRes.json().catch(() => null);

    if (!userRes.ok || !userJson?.id) {
      return new Response(JSON.stringify({ success: false, error: "Unauthenticated user", auth: userJson }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId: string = userJson.id;

    // ---------------------------------------
    // CREATE PAYMENT ROW (PENDING) via PostgREST
    // (ensures your RLS policy with auth.uid() works)
    // ---------------------------------------
    const amountInLaari = Math.round(totalAmountMvr * 100);

    const paymentInsertPayload: Record<string, unknown> = {
      user_id: userId,
      course_id: courseId,
      pricing_id: pricingId,
      payment_method: "bml",
      status: "pending",
      currency: "MVR",
      amount: amountInLaari,         // integer (laari)
      total_amount: totalAmountMvr,  // numeric (MVR)
    };

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/payments?select=id`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(paymentInsertPayload),
    });

    const insertText = await insertRes.text();
    let insertData: any = insertText;
    try {
      insertData = JSON.parse(insertText);
    } catch {
      // keep text
    }

    if (!insertRes.ok) {
      console.error("DB insert failed:", insertData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create payment record", db: insertData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paymentId = Array.isArray(insertData) ? insertData?.[0]?.id : insertData?.id;
    if (!paymentId) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment insert succeeded but id missing", db: insertData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------------------------------------
    // BUILD BML PAYLOAD (LAARI)
    // ---------------------------------------
    const payload = {
      amount: amountInLaari,
      currency: "MVR",
      redirectUrl: PAYMENT_REDIRECT_URL,
      localId: paymentId,
      customerReference: "ELC Course Payment",
    };

    console.log("🚀 Payload sent to BML:", payload);

    // ---------------------------------------
    // SEND REQUEST TO BML  ✅ (your requested format)
    // ---------------------------------------
    const response = await fetch(`${BML_API_URL}/public/v2/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": BML_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: any = text;

    try {
      data = JSON.parse(text);
    } catch {
      console.warn("⚠️ Non-JSON response from BML:", text);
    }

    console.log("🔵 BML Response:", data);

    if (!response.ok) {
      // keep structure close to your working example,
      // but also include success:false for frontend clarity
      return new Response(JSON.stringify({ success: false, error: "BML create transaction failed", bml: data }), {
        status: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    // ---------------------------------------
    // FIND BML REDIRECT URL
    // ---------------------------------------
    const redirectUrl =
      data?.shortUrl || data?.url || data?.redirectUrl || null;

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        redirectUrl,
        paymentUrl: redirectUrl, // ✅ alias for frontend
        raw: data,
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("🔥 ERROR:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
});
