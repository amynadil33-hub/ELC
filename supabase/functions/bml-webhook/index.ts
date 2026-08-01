import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    console.log("📩 BML CALLBACK RECEIVED:", payload);

    const state = payload?.state;
    const localId = payload?.localId; // we set this to payments.id
    if (!state || !localId) {
      return new Response("Bad Request", { status: 400 });
    }

    if (state === "CONFIRMED") {
      const { error } = await supabaseAdmin
        .from("payments")
        .update({ status: "paid" })
        .eq("id", localId);

      if (error) {
        console.error("❌ DB update failed:", error);
        return new Response("DB Error", { status: 500 });
      }

      return new Response("OK", { status: 200 });
    }

    // FAILED / CANCELLED / etc
    await supabaseAdmin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", localId);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("💥 bml-webhook error:", err);
    return new Response("Server Error", { status: 500 });
  }
});
