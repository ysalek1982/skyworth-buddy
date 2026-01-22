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
      .in("key", ["WHATSAPP_PROVIDER", "WHATSAPP_API_URL", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "WHATSAPP_ENABLED"]);

    const settingsMap: Record<string, { value: string | null; is_enabled: boolean }> = {};
    settings?.forEach((s) => {
      settingsMap[s.key] = { value: s.value, is_enabled: s.is_enabled };
    });

    if (!settingsMap["WHATSAPP_ENABLED"]?.is_enabled) {
      console.log("WhatsApp disabled, skipping send");
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp está deshabilitado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = settingsMap["WHATSAPP_PROVIDER"]?.value || "meta";
    const apiUrl = settingsMap["WHATSAPP_API_URL"]?.value;
    const token = settingsMap["WHATSAPP_TOKEN"]?.value;
    const phoneId = settingsMap["WHATSAPP_PHONE_ID"]?.value;

    if (!token || !phoneId) {
      return new Response(
        JSON.stringify({ error: "Configuración de WhatsApp incompleta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get template from database
    const { data: template } = await supabase
      .from("notification_templates")
      .select("name, body")
      .eq("type", "whatsapp")
      .eq("name", template_name)
      .eq("is_active", true)
      .single();

    // Format phone number
    const formattedPhone = to.replace(/\D/g, "");

    let response;

    if (provider === "meta") {
      // Meta WhatsApp Business API
      // Allow admins to set either:
      // - Base URL: https://graph.facebook.com/v18.0
      // - Full endpoint: https://graph.facebook.com/v18.0/<PHONE_ID>/messages
      // - Template URL containing {PHONE_ID}
      const rawApiUrl = (apiUrl || "").trim();
      const normalizedApiUrl = rawApiUrl.replace(/\/$/, "");

      const url = !normalizedApiUrl
        ? `https://graph.facebook.com/v18.0/${phoneId}/messages`
        : normalizedApiUrl.includes("{PHONE_ID}")
          ? normalizedApiUrl.replaceAll("{PHONE_ID}", phoneId)
          : normalizedApiUrl.endsWith("/messages")
            ? normalizedApiUrl
            : `${normalizedApiUrl}/${phoneId}/messages`;
      
      // Build template components from variables
      const components = variables ? [
        {
          type: "body",
          parameters: Object.values(variables).map((value) => ({
            type: "text",
            text: String(value),
          })),
        },
      ] : [];

      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "template",
          template: {
            name: template?.name || template_name,
            language: { code: "es" },
            components,
          },
        }),
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
      console.error("WhatsApp API error:", data);
      return new Response(
        JSON.stringify({ error: "Error al enviar WhatsApp", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("WhatsApp sent successfully to:", formattedPhone);

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
