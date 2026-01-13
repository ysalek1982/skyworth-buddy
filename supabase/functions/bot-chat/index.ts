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
    const { message, conversation_history = [] } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get settings
    const { data: settings } = await supabase
      .from("secure_settings")
      .select("key, value, is_enabled")
      .in("key", ["GEMINI_API_KEY", "GEMINI_MODEL", "BOT_ENABLED"]);

    const settingsMap: Record<string, { value: string | null; is_enabled: boolean }> = {};
    settings?.forEach((s) => {
      settingsMap[s.key] = { value: s.value, is_enabled: s.is_enabled };
    });

    if (!settingsMap["BOT_ENABLED"]?.is_enabled) {
      return new Response(
        JSON.stringify({ error: "El bot está deshabilitado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiKey = settingsMap["GEMINI_API_KEY"]?.value;
    const geminiModel = settingsMap["GEMINI_MODEL"]?.value || "gemini-1.5-flash";

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "API Key de Gemini no configurada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get knowledge base
    const { data: knowledge } = await supabase
      .from("knowledge_base")
      .select("title, content, category")
      .eq("is_active", true);

    const knowledgeContext = knowledge
      ?.map((k) => `## ${k.title}\n${k.content}`)
      .join("\n\n") || "";

    const systemPrompt = `Eres un asistente virtual de Skyworth Goal Getter 2026, una promoción de televisores Skyworth.

INFORMACIÓN DE LA PROMOCIÓN:
${knowledgeContext}

INSTRUCCIONES:
- Responde de manera amable y profesional
- Si no sabes algo, indica que pueden contactar al soporte
- Mantén las respuestas concisas pero informativas
- Ayuda con preguntas sobre registro, cupones, sorteos y productos`;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...conversation_history.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini error:", data.error);
      return new Response(
        JSON.stringify({ error: "Error al procesar la solicitud" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in bot-chat:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
