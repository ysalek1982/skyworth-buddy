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
    const { image_url, document_type } = await req.json();

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
        JSON.stringify({ error: "API Key de Gemini no configurada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch image and convert to base64
    const imageResponse = await fetch(image_url);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    let prompt = "";
    switch (document_type) {
      case "id_front":
        prompt = `Analiza esta imagen de documento de identidad (frente). Verifica:
1. ¿Es un documento de identidad válido (cédula, DNI, pasaporte)?
2. ¿Se puede leer el nombre y número de documento?
3. ¿La foto es clara y legible?

Responde en JSON con el formato:
{
  "is_valid": true/false,
  "document_type": "tipo detectado",
  "name_visible": true/false,
  "number_visible": true/false,
  "confidence": 0-100,
  "issues": ["lista de problemas si hay"]
}`;
        break;
      case "id_back":
        prompt = `Analiza esta imagen del reverso de un documento de identidad. Verifica:
1. ¿Es el reverso de un documento válido?
2. ¿Es legible?

Responde en JSON:
{
  "is_valid": true/false,
  "confidence": 0-100,
  "issues": []
}`;
        break;
      case "invoice":
        prompt = `Analiza esta imagen de factura. Verifica:
1. ¿Es una factura comercial válida?
2. ¿Se puede identificar el vendedor/tienda?
3. ¿Hay una fecha visible?
4. ¿Se puede identificar algún producto Skyworth o televisor?

Responde en JSON:
{
  "is_valid": true/false,
  "store_name": "nombre si visible",
  "date_visible": true/false,
  "product_mentioned": true/false,
  "confidence": 0-100,
  "issues": []
}`;
        break;
      default:
        prompt = "Describe qué tipo de documento es esta imagen y si parece válido.";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Gemini Vision error:", data.error);
      return new Response(
        JSON.stringify({ error: "Error al analizar documento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Try to parse JSON from response
    let result;
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { raw_response: textResponse, is_valid: false };
      }
    } catch {
      result = { raw_response: textResponse, is_valid: false };
    }

    return new Response(
      JSON.stringify({ validation: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in doc-validate:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
