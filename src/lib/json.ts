export function json(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
    { status, headers: { "content-type": "application/json" } },
  );
}
