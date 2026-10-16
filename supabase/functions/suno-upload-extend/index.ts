import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.55.0";
import { validateInput } from "./validation.ts";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const ENDPOINT = "https://api.sunoapi.org/api/v1/generate/upload-extend";
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  if (req.method !== "POST") return reply({ error: "Dozwolona jest tylko metoda POST." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply({ error: "Wymagana jest sesja użytkownika." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return reply({ error: "Brak konfiguracji Supabase." }, 500);

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return reply({ error: "Sesja jest nieprawidłowa lub wygasła." }, 401);

  let body: unknown;
  try { body = await req.json(); } catch { return reply({ error: "Nieprawidłowy JSON." }, 400); }
  const validated = validateInput(body);
  if (validated.error || !validated.data) return reply({ error: validated.error }, 400);

  const apiKey = Deno.env.get("SUNO_API_KEY");
  if (!apiKey) return reply({ error: "Brak sekretu SUNO_API_KEY." }, 503);

  try {
    const upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(validated.data),
      signal: AbortSignal.timeout(25_000),
    });
    const raw = await upstream.text();
    let result: unknown;
    try { result = raw ? JSON.parse(raw) : {}; } catch { result = { message: "Nieprawidłowa odpowiedź dostawcy." }; }
    const payload = result && typeof result === "object" ? result as Record<string, unknown> : {};
    const code = payload.code;
    if (!upstream.ok || (code !== undefined && code !== 200)) {
      console.error("SunoAPI upload-extend rejected request", { httpStatus: upstream.status, providerCode: code ?? null });
      return reply({
        error: "SunoAPI odrzuciło żądanie.",
        upstreamStatus: upstream.status,
        providerCode: code ?? null,
        message: typeof (payload.msg ?? payload.message) === "string" ? String(payload.msg ?? payload.message).slice(0, 300) : undefined,
      }, upstream.status >= 500 ? 503 : 502);
    }
    return reply({ provider: "sunoapi", operation: "upload-extend", result }, 202);
  } catch (error) {
    const timeout = error instanceof DOMException && error.name === "TimeoutError";
    console.error("SunoAPI request failed", timeout ? "timeout" : "network error");
    return reply({ error: timeout ? "Przekroczono limit czasu SunoAPI." : "Nie udało się połączyć z SunoAPI." }, 502);
  }
});
