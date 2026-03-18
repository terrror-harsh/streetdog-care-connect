import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a veterinary AI assistant specialized in street dog health assessment. Analyze the dog photo and return a JSON assessment. Be concise but thorough. Always respond with valid JSON only, no markdown.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this photo of a street dog. Return ONLY a JSON object with these fields:
{
  "isDog": boolean (is there a dog in the image?),
  "breed": string (estimated breed or "Mixed/Unknown"),
  "estimatedAge": string (e.g. "Puppy", "Young Adult", "Adult", "Senior"),
  "bodyCondition": string ("Emaciated", "Thin", "Normal", "Overweight"),
  "visibleInjuries": string[] (list any visible injuries),
  "healthConcerns": string[] (list health concerns),
  "suggestedCategory": string ("injury" | "disease" | "hunger" | "emergency"),
  "suggestedSeverity": string ("low" | "medium" | "high" | "critical"),
  "description": string (brief 1-2 sentence assessment),
  "confidence": number (0-100, your confidence in the assessment)
}`
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "dog_assessment",
              description: "Return structured dog health assessment",
              parameters: {
                type: "object",
                properties: {
                  isDog: { type: "boolean" },
                  breed: { type: "string" },
                  estimatedAge: { type: "string" },
                  bodyCondition: { type: "string" },
                  visibleInjuries: { type: "array", items: { type: "string" } },
                  healthConcerns: { type: "array", items: { type: "string" } },
                  suggestedCategory: { type: "string", enum: ["injury", "disease", "hunger", "emergency"] },
                  suggestedSeverity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  description: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["isDog", "breed", "estimatedAge", "bodyCondition", "visibleInjuries", "healthConcerns", "suggestedCategory", "suggestedSeverity", "description", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "dog_assessment" } }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let assessment;
    if (toolCall) {
      assessment = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content as JSON
      const content = data.choices?.[0]?.message?.content || "";
      assessment = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    }

    return new Response(JSON.stringify(assessment), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("analyze-dog error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
