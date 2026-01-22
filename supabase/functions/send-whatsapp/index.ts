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
    const { to, template_name, variables } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get settings
    const { data: settings } = await supabase
      .from("secure_settings")
      .select("key, value, is_enabled")
      .in("key", [
        "WHATSAPP_PROVIDER",
        "WHATSAPP_API_URL",
        "WHATSAPP_TOKEN",
        "WHATSAPP_PHONE_ID",
        "WHATSAPP_TEMPLATE_LANG",
        "WHATSAPP_ENABLED",
      ]);

    const settingsMap: Record<string, { value: string | null; is_enabled: boolean }> = {};
    settings?.forEach((s) => {
      settingsMap[s.key] = { value: s.value, is_enabled: s.is_enabled };
    });

    // Check if WhatsApp is enabled - IMPORTANT: check is_enabled field
    const isWhatsAppEnabled = settingsMap["WHATSAPP_ENABLED"]?.is_enabled === true;
    
    if (!isWhatsAppEnabled) {
      console.log("WhatsApp disabled (is_enabled=false), skipping send");
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp está deshabilitado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = settingsMap["WHATSAPP_PROVIDER"]?.value || "meta";
    const apiUrl = settingsMap["WHATSAPP_API_URL"]?.value;
    const token = settingsMap["WHATSAPP_TOKEN"]?.value;
    const phoneId = settingsMap["WHATSAPP_PHONE_ID"]?.value;
    const templateLang = settingsMap["WHATSAPP_TEMPLATE_LANG"]?.value || "es_ES";

    if (!token || !phoneId) {
      console.error("WhatsApp config incomplete - token:", !!token, "phoneId:", !!phoneId);
      return new Response(
        JSON.stringify({ error: "Configuración de WhatsApp incompleta (falta token o phone ID)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number (remove all non-digits)
    let formattedPhone = to.replace(/\D/g, "");
    // Ensure it starts with country code (Bolivia = 591)
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "591" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("591") && formattedPhone.length <= 8) {
      formattedPhone = "591" + formattedPhone;
    }

    console.log("Sending WhatsApp to:", formattedPhone, "template:", template_name, "lang:", templateLang);

    let response;

    if (provider === "meta" || !provider) {
      // Meta WhatsApp Business API
      const rawApiUrl = (apiUrl || "").trim();
      const normalizedApiUrl = rawApiUrl.replace(/\/$/, "");

      const url = !normalizedApiUrl
        ? `https://graph.facebook.com/v18.0/${phoneId}/messages`
        : normalizedApiUrl.includes("{PHONE_ID}")
          ? normalizedApiUrl.replaceAll("{PHONE_ID}", phoneId)
          : normalizedApiUrl.endsWith("/messages")
            ? normalizedApiUrl
            : `${normalizedApiUrl}/${phoneId}/messages`;

      console.log("Meta API URL:", url);

      // Build template components from variables
      const components = variables
        ? [
            {
              type: "body",
              parameters: Object.values(variables).map((value) => ({
                type: "text",
                text: String(value),
              })),
            },
          ]
        : [];

      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: template_name,
          language: { code: templateLang },
          components,
        },
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      // Generic API provider
      const url = apiUrl || "";
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formattedPhone,
          template: template_name,
          variables,
        }),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", JSON.stringify(data));
      
      // Parse Meta error for better messaging
      let errorMessage = "Error al enviar WhatsApp";
      if (data?.error?.message) {
        errorMessage = data.error.message;
        if (data.error.code === 132000) {
          errorMessage = `Template "${template_name}" no encontrado o no aprobado para idioma "${templateLang}"`;
        } else if (data.error.code === 131030) {
          errorMessage = "Número de teléfono inválido o no registrado en WhatsApp";
        }
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("WhatsApp sent successfully to:", formattedPhone, "response:", JSON.stringify(data));

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending WhatsApp:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
