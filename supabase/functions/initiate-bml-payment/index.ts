import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    // ---------------------------------------
    // CORS
    // ---------------------------------------
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    }

    // ---------------------------------------
    // PARSE BODY
    // ---------------------------------------
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const { amount, currency = "MVR", userId, courseId } = body;

    if (!amount || !userId || !courseId) {
      return new Response(
        JSON.stringify({ error: "Missing amount, userId, or courseId" }),
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ---------------------------------------
    // CREATE PAYMENT ROW
    // ---------------------------------------
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        course_id: courseId,
        total_amount: amount,
        currency,
        status: "pending_gateway",
        payment_method: "bml",
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("❌ Payment insert failed", paymentError);
      return new Response(JSON.stringify({ error: "Payment creation failed" }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // ---------------------------------------
    // BML CONFIG
    // ---------------------------------------
    const BML_API_URL = Deno.env.get("BML_API_URL")!;
    const BML_API_KEY = Deno.env.get("BML_API_KEY")!;
    const BML_RETURN_URL = Deno.env.get("PAYMENT_REDIRECT_URL")!;

    const amountInLaari = Math.round(Number(amount) * 100);

    const payload = {
      amount: amountInLaari,
      currency,
      redirectUrl: `${BML_RETURN_URL}?payment_id=${payment.id}`,
      localId: payment.id,
      customerReference: `ELC-${payment.id.slice(0, 8)}`,
    };

    console.log("🚀 Sending to BML:", payload);

    const response = await fetch(`${BML_API_URL}/public/v2/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${BML_API_KEY}`, // safer
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: any = text;

    try {
      data = JSON.parse(text);
    } catch {}

    if (!response.ok) {
      console.error("❌ BML error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const redirectUrl =
      data?.shortUrl || data?.url || data?.redirectUrl;

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
        paymentId: payment.id,
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("🔥 initiate-bml-payment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
