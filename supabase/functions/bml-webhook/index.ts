import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------
// Supabase Admin Client (Service Role)
// ---------------------------------------
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    // ---------------------------------------
    // Only allow POST (BML webhook)
    // ---------------------------------------
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // ---------------------------------------
    // Parse JSON payload safely
    // ---------------------------------------
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    console.log("📩 BML WEBHOOK RECEIVED:", payload);

    // ---------------------------------------
    // Expected BML fields
    // ---------------------------------------
    const {
      transactionId, // BML transaction reference
      localId,       // OUR payments.id
      state,         // CONFIRMED | FAILED | CANCELLED
      amount,
      currency,
    } = payload;

    if (!transactionId || !localId || !state) {
      console.error("❌ Invalid webhook payload");
      return new Response("Bad Request", { status: 400 });
    }

    // ---------------------------------------
    // Fetch payment (idempotency check)
    // ---------------------------------------
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("id", localId)
      .single();

    if (fetchError || !payment) {
      console.error("❌ Payment not found:", localId);
      return new Response("Not Found", { status: 404 });
    }

    // ---------------------------------------
    // Ignore duplicate callbacks
    // ---------------------------------------
    if (payment.status === "paid") {
      console.log("🔁 Duplicate webhook ignored:", localId);
      return new Response("OK", { status: 200 });
    }

    // ---------------------------------------
    // CONFIRMED → MARK AS PAID
    // ---------------------------------------
    if (state === "CONFIRMED") {
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          gateway_reference: transactionId,
          gateway_status: state,
          paid_at: new Date().toISOString(),
        })
        .eq("id", localId);

      if (updateError) {
        console.error("❌ DB update failed:", updateError);
        return new Response("DB Error", { status: 500 });
      }

      console.log("✅ Payment confirmed:", localId);
      return new Response("OK", { status: 200 });
    }

    // ---------------------------------------
    // FAILED / CANCELLED
    // ---------------------------------------
    await supabaseAdmin
      .from("payments")
      .update({
        status: "failed",
        gateway_reference: transactionId,
        gateway_status: state,
      })
      .eq("id", localId);

    console.log("ℹ️ Payment failed:", localId, state);
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("💥 BML webhook error:", err);
    return new Response("Server Error", { status: 500 });
  }
});
