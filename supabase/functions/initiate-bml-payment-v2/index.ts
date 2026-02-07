import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function safeJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

serve(async (req) => {
  try {
    // ---------------------------------------
    // CORS PRE-FLIGHT
    // ---------------------------------------
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (req.method !== "POST") return jsonResp({ success: false, error: "Method not allowed" }, 405);

    // ---------------------------------------
    // SAFE JSON PARSE
    // ---------------------------------------
    const body = await safeJson(req);
    if (!body) return jsonResp({ success: false, error: "Invalid JSON body" }, 400);

    const courseId = body?.courseId ?? body?.course_id;
    const pricingId = body?.pricingId ?? body?.pricing_id ?? null;

    const amountRaw = body?.amount ?? body?.total_amount;
    const totalAmountMvr = Number(amountRaw);

    if (!courseId) return jsonResp({ success: false, error: "Missing courseId" }, 400);
    if (!Number.isFinite(totalAmountMvr) || totalAmountMvr <= 0) {
      return jsonResp({ success: false, error: "Invalid amount", amountRaw }, 400);
    }

    // ---------------------------------------
    // ENV VARS
    // ---------------------------------------
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    const BML_API_URL = Deno.env.get("BML_API_URL");
    const BML_API_KEY = Deno.env.get("BML_API_KEY");
    const PAYMENT_REDIRECT_URL = Deno.env.get("PAYMENT_REDIRECT_URL");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return jsonResp(
        { success: false, error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY in Edge Function secrets" },
        500
      );
    }

    if (!BML_API_URL || !BML_API_KEY || !PAYMENT_REDIRECT_URL) {
      return jsonResp(
        { success: false, error: "Missing BML secrets (BML_API_URL/BML_API_KEY/PAYMENT_REDIRECT_URL)" },
        500
      );
    }

    // ---------------------------------------
    // AUTH HEADER (FROM FRONTEND)
    // ---------------------------------------
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("Authorization") ||
      "";

    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return jsonResp({ success: false, error: "Missing Bearer token" }, 401);
    }

    // ---------------------------------------
    // GET USER (AUTH API) — guarantees token is valid
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
      return jsonResp({ success: false, error: "Unauthenticated user", auth: userJson }, 401);
    }

    const userId: string = userJson.id;

    // ---------------------------------------
    // CREATE PAYMENT ROW (PENDING) via PostgREST
    // This is the critical change: explicit Authorization + apikey
    // ---------------------------------------
    const amountInLaari = Math.round(totalAmountMvr * 100);

    const paymentInsertPayload: Record<string, unknown> = {
      user_id: userId,
      course_id: courseId,
      pricing_id: pricingId,        // ok if null
      amount: amountInLaari,        // integer (LAARI)
      total_amount: totalAmountMvr, // numeric (MVR)
      currency: "MVR",
      payment_method: "bml",
      status: "pending",
    };

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/payments?select=id`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader, // ✅ this is what makes auth.uid() work
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(paymentInsertPayload),
    });

    const insertText = await insertRes.text();
    let insertJson: any = insertText;
    try { insertJson = JSON.parse(insertText); } catch {}

    if (!insertRes.ok) {
      // This will show 42501 details directly
      return jsonResp(
        { success: false, error: "Failed to create payment record", db: insertJson },
        500
      );
    }

    const paymentId = Array.isArray(insertJson) ? insertJson?.[0]?.id : insertJson?.id;
    if (!paymentId) {
      return jsonResp(
        { success: false, error: "Payment insert succeeded but id missing", db: insertJson },
        500
      );
    }

    // ---------------------------------------
    // CALL BML
    // ---------------------------------------
    const bmlPayload = {
      amount: amountInLaari,
      currency: "MVR",
      redirectUrl: PAYMENT_REDIRECT_URL,
      localId: paymentId, // best mapping key
      customerReference: "ELC Course Payment",
    };

    console.log("🚀 Payload sent to BML:", bmlPayload);

    const bmlRes = await fetch(`${BML_API_URL}/public/v2/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: BML_API_KEY,
      },
      body: JSON.stringify(bmlPayload),
    });

    const bmlText = await bmlRes.text();
    let bmlJson: any = bmlText;
    try { bmlJson = JSON.parse(bmlText); } catch {}

    console.log("🔵 BML Response:", bmlJson);

    if (!bmlRes.ok) {
      return jsonResp(
        { success: false, error: "BML create transaction failed", bml: bmlJson },
        bmlRes.status
      );
    }

    const paymentUrl = bmlJson?.shortUrl || bmlJson?.url || bmlJson?.redirectUrl || null;

    if (!paymentUrl) {
      return jsonResp(
        { success: false, error: "BML did not return redirect URL", raw: bmlJson },
        500
      );
    }

    return jsonResp({
      success: true,
      paymentId,
      paymentUrl,
    });
  } catch (err: any) {
    console.error("🔥 ERROR:", err);
    return jsonResp({ success: false, error: err?.message || "Unknown error" }, 500);
  }
});
