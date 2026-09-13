const MODEL = "gemini-3.5-flash-lite";

const SCENE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    scene_type: { type: "string", enum: ["process_flow", "comparison", "timeline"] },
    theme: { type: "string", enum: ["light", "dark"] },
    duration: { type: "number", minimum: 3, maximum: 30 },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          detail: { type: "string" }
        },
        required: ["id", "label"]
      }
    },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["fade_in", "move", "highlight", "scale", "show"] },
          target: { type: "string" },
          start: { type: "number", minimum: 0, maximum: 30 },
          duration: { type: "number", minimum: 0.1, maximum: 5 }
        },
        required: ["type", "target", "start", "duration"]
      }
    }
  },
  required: ["title", "scene_type", "theme", "duration", "items", "actions"]
};

function corsHeaders() {
  return {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured." }), { status: 500, headers: corsHeaders() });
    }

    const body = await request.json();
    const prompt = String(body?.prompt || "").trim();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Please enter a scene description." }), { status: 400, headers: corsHeaders() });
    }
    if (prompt.length > 2000) {
      return new Response(JSON.stringify({ error: "Prompt is too long. Keep it under 2000 characters." }), { status: 400, headers: corsHeaders() });
    }

    const instruction = `You are a visual explainer planner. Convert the user's idea into a simple 2D animation plan.
Use only the allowed scene types and actions in the schema. Keep labels short and readable.
Prefer 3-7 items. Make the sequence understandable without narration.
Do not output code. Do not invent extra properties.
User request:\n${prompt}`;

    const url = "https://generativelanguage.googleapis.com/v1beta/interactions";
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        input: instruction,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: SCENE_SCHEMA,
        },
        generation_config: {
          thinking_level: "minimal",
          max_output_tokens: 1200,
        },
        store: false,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "Gemini request failed." }), { status: 502, headers: corsHeaders() });
    }

    const text = data?.output_text
      || data?.steps?.slice().reverse().find((step) => step?.type === "model_output")?.content?.find((item) => item?.type === "text")?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: "Gemini returned no scene." }), { status: 502, headers: corsHeaders() });
    }

    let scene;
    try {
      scene = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "Gemini returned invalid JSON." }), { status: 502, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ scene }), { status: 200, headers: corsHeaders() });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Unexpected server error." }), { status: 500, headers: corsHeaders() });
  }
}
