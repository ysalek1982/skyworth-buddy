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
    const { test_phone } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get WhatsApp settings
    const { data: settings } = await supabase
      .from("secure_settings")
      .select("key, value")
      .in("key", ["WHATSAPP_PROVIDER", "WHATSAPP_API_URL", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s) => {
      if (s.value) settingsMap[s.key] = s.value;
    });

    const provider = settingsMap["WHATSAPP_PROVIDER"] || "meta";
    const apiUrl = settingsMap["WHATSAPP_API_URL"];
    const token = settingsMap["WHATSAPP_TOKEN"];
    const phoneId = settingsMap["WHATSAPP_PHONE_ID"];

    if (!token || !phoneId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Configuración de WhatsApp incompleta",
          missing: {
            token: !token,
            phoneId: !phoneId,
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test Meta API connection by checking the phone number ID
    if (provider === "meta") {
      const url = `https://graph.facebook.com/v18.0/${phoneId}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.error) {
        console.error("WhatsApp API test error:", data.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: data.error.message,
            code: data.error.code 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Conexión exitosa con WhatsApp Business API",
          phone_info: {
            display_phone_number: data.display_phone_number,
            verified_name: data.verified_name,
            quality_rating: data.quality_rating,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other providers, just verify settings exist
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Configuración de WhatsApp verificada",
        provider,
        note: "Para probar el envío, necesitas un número de teléfono válido"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error testing WhatsApp:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
