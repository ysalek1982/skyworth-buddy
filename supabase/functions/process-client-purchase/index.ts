import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { purchase_id, action, rejection_reason } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabase
      .from("client_purchases")
      .select("*, products(*)")
      .eq("id", purchase_id)
      .single();

    if (purchaseError || !purchase) {
      return new Response(
        JSON.stringify({ error: "Compra no encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reject") {
      // Update purchase status to rejected
      await supabase
        .from("client_purchases")
        .update({
          admin_status: "REJECTED",
          rejection_reason: rejection_reason || "Documentos inválidos",
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase_id);

      return new Response(
        JSON.stringify({ success: true, message: "Compra rechazada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve") {
      // Call the RPC to register the buyer serial and generate coupons
      const { data: rpcResult, error: rpcError } = await supabase.rpc("rpc_register_buyer_serial", {
        p_serial_number: purchase.serial_number,
        p_full_name: purchase.full_name,
        p_dni: purchase.dni,
        p_email: purchase.email,
        p_phone: purchase.phone,
        p_city: purchase.city || "",
        p_purchase_date: purchase.purchase_date,
        p_user_id: purchase.user_id,
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        return new Response(
          JSON.stringify({ error: rpcError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!rpcResult.success) {
        return new Response(
          JSON.stringify({ error: rpcResult.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update purchase status
      await supabase
        .from("client_purchases")
        .update({
          admin_status: "APPROVED",
          coupons_generated: rpcResult.coupon_count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase_id);

      // Send notifications
      const couponsText = rpcResult.coupons.join(", ");
      const productModel = purchase.products?.model_name || "TV Skyworth";

      // Try to send email
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: purchase.email,
            template_type: "purchase_approved",
            variables: {
              nombre: purchase.full_name,
              cupones: couponsText,
              modelo: productModel,
              cantidad_cupones: rpcResult.coupon_count,
            },
          },
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      // Try to send WhatsApp
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: purchase.phone,
            template_name: "purchase_approved",
            variables: {
              nombre: purchase.full_name,
              cupones: couponsText,
              modelo: productModel,
            },
          },
        });
      } catch (whatsappError) {
        console.error("Error sending WhatsApp:", whatsappError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Compra aprobada",
          coupons: rpcResult.coupons,
          coupon_count: rpcResult.coupon_count,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Acción no válida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing purchase:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
