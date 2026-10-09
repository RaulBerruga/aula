// Aula · Edge Function "sugerir": propone las asignaturas de un curso usando la API de Claude.
// Despliegue: supabase functions deploy sugerir
// Secreto necesario: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Opcional: supabase secrets set AI_MODEL=claude-haiku-5-5
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  // Solo usuarios con sesión iniciada en Aula
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return json({ error: "No autorizado" }, 401);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "Falta el secreto ANTHROPIC_API_KEY" }, 500);

  const b = await req.json().catch(() => ({}));
  const nper = Math.max(1, Math.min(3, Number(b.periods) || 2));
  const prompt = `Eres un asistente académico para estudiantes universitarios en España. Devuelve las asignaturas del plan de estudios indicado.
Universidad: ${b.university || "(no indicada)"}
Titulación: ${b.degree || "(no indicada)"}
Curso: ${b.year || 1}º
Periodos lectivos por año: ${nper} (${b.periodsName || "cuatrimestre"})
Responde SOLO con JSON válido, sin texto adicional, con esta forma exacta:
{"approx": true|false, "subjects":[{"name":"Nombre oficial de la asignatura","credits":6,"type":"BA"|"OB"|"OP"|"PE"|"TFG","semester":1}]}
- "semester" es el número del periodo (1..${nper}) o "anual".
- "type": BA=formación básica, OB=obligatoria, OP=optativa, PE=prácticas externas, TFG=trabajo fin de grado.
- Si conoces el plan exacto de esa universidad usa sus nombres oficiales y approx=false. Si no lo conoces con seguridad, propón las asignaturas más habituales de ese grado y curso en universidades españolas y pon approx=true.
- Entre 6 y 14 asignaturas. Créditos típicos 6 (también 3, 4.5, 9, 12).`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("AI_MODEL") || "claude-haiku-5-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await r.json();
  if (!r.ok) return json({ error: d?.error?.message || "Error de la API de IA" }, 502);
  const text = (d.content || []).map((c: { text?: string }) => c.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean);
    return json({ approx: !!parsed.approx, subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [] });
  } catch {
    return json({ error: "La IA no devolvió un JSON válido", raw: clean.slice(0, 400) }, 502);
  }
});
