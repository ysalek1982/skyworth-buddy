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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Gemini settings
    const { data: settings } = await supabase
      .from("secure_settings")
      .select("key, value")
      .in("key", ["GEMINI_API_KEY", "GEMINI_MODEL"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s) => {
      if (s.value) settingsMap[s.key] = s.value;
    });

    const geminiKey = settingsMap["GEMINI_API_KEY"];
    const geminiModel = settingsMap["GEMINI_MODEL"] || "gemini-1.5-flash";

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "API Key de Gemini no configurada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test the API with a simple request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Responde solo con: OK" }],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 10,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Gemini test error:", data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conexión exitosa con Gemini",
        model: geminiModel,
        response: text 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error testing Gemini:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
