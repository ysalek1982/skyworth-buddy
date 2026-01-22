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
    // Parse body (may be empty for simple test)
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is OK for testing
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get WhatsApp settings
    const { data: settings, error: settingsError } = await supabase
      .from("secure_settings")
      .select("key, value, is_enabled")
      .in("key", ["WHATSAPP_PROVIDER", "WHATSAPP_API_URL", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "WHATSAPP_ENABLED"]);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Error al obtener configuración: " + settingsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settingsMap: Record<string, { value: string | null; is_enabled: boolean }> = {};
    settings?.forEach((s) => {
      settingsMap[s.key] = { value: s.value, is_enabled: s.is_enabled };
    });

    // Check if WhatsApp is enabled
    const isEnabled = settingsMap["WHATSAPP_ENABLED"]?.is_enabled === true;
    
    const provider = (settingsMap["WHATSAPP_PROVIDER"]?.value || "meta").trim();
    const apiUrl = (settingsMap["WHATSAPP_API_URL"]?.value || "").trim();
    const token = (settingsMap["WHATSAPP_TOKEN"]?.value || "").trim();
    const phoneId = (settingsMap["WHATSAPP_PHONE_ID"]?.value || "").trim();

    // Validate required fields
    const missingFields: string[] = [];
    if (!token) missingFields.push("Token de acceso (WHATSAPP_TOKEN)");
    if (!phoneId) missingFields.push("Phone Number ID (WHATSAPP_PHONE_ID)");

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Configuración incompleta. Faltan: ${missingFields.join(", ")}`,
          missing: {
            token: !token,
            phoneId: !phoneId,
          },
          hint: "Ve a Configuración → WhatsApp y completa todos los campos requeridos."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Testing WhatsApp with:", { provider, phoneId: phoneId.substring(0, 4) + "...", isEnabled });

    // Test Meta API connection by checking the phone number ID
    if (provider === "meta" || !provider) {
      const url = `https://graph.facebook.com/v18.0/${phoneId}`;
      
      console.log("Testing Meta API at:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.error) {
        console.error("WhatsApp API test error:", data.error);
        
        // Provide helpful error messages
        let userMessage = data.error.message;
        if (data.error.code === 190) {
          userMessage = "Token inválido o expirado. Genera un nuevo token en Meta Business Suite.";
        } else if (data.error.code === 100) {
          userMessage = "Phone ID inválido. Verifica el ID en Meta Business Suite → WhatsApp → Configuración de la API.";
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: userMessage,
            code: data.error.code,
            details: data.error.message
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "✅ Conexión exitosa con WhatsApp Business API",
          enabled: isEnabled,
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
        enabled: isEnabled,
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
