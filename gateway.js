const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
async function authorised(req, secret) {
  if (!secret || secret.length < 32) return false;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(secret))]);
  return crypto.subtle.timingSafeEqual(a, b);
}
var index_default = {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === "/health") return json({ ok: true });
    if (pathname !== "/query") return json({ error: "Not found" }, 404);
    if (req.method !== "POST") return json({ error: "Use POST" }, 405);
    if (!await authorised(req, env.GATEWAY_TOKEN)) return json({ error: "Unauthorised" }, 401);
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body must be JSON" }, 400);
    }
    const list = body.statements;
    if (!Array.isArray(list) || !list.length || list.length > 200 || list.some((s) => typeof s?.sql !== "string")) return json({ error: "Send 1\u2013200 statements" }, 400);
    try {
      const prepared = list.map((s2) => env.DB.prepare(s2.sql).bind(...s2.params ?? []));
      if (body.batch) return json({ results: await env.DB.batch(prepared) });
      const s = list[0];
      const stmt = prepared[0];
      const result = s.mode === "raw" ? await stmt.raw() : s.mode === "run" ? await stmt.run() : s.mode === "first" ? await stmt.first() : await stmt.all();
      return json({ results: [result] });
    } catch (e) {
      const err = e;
      const cause = err.cause?.message;
      return json({ error: cause && !err.message.includes(cause) ? `${err.message}: ${cause}` : err.message }, 400);
    }
  }
};
export {
  index_default as default
};
