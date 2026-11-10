import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/auth/server";
import { PLATFORM_COOKIE } from "@/lib/auth/contracts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed: Record<string, string[]> = {
  "auth/challenge": ["GET"],
  "auth/login": ["POST"],
  "auth/logout": ["POST"],
  "auth/me": ["GET"],
  companies: ["GET"],
};
const uuid = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
function methods(resource: string) {
  if (resource === "administrators") return ["GET", "POST"];
  if (new RegExp(`^administrators/${uuid}$`).test(resource)) return ["PATCH"];
  if (resource === "settings/openai") return ["GET", "PATCH"];
  if (["settings/openai/test", "settings/openai/remove"].includes(resource)) return ["POST"];
  if (resource === "knowledge" || resource === "knowledge/imports") return ["GET", "POST"];
  if (new RegExp(`^knowledge/imports/${uuid}$`).test(resource)) return ["GET"];
  if (new RegExp(`^knowledge/${uuid}$`).test(resource)) return ["GET", "PATCH"];
  if (new RegExp(`^knowledge/${uuid}/revisions$`).test(resource)) return ["GET"];
  if (new RegExp(`^knowledge/${uuid}/(?:publish|deactivate)$`).test(resource)) return ["POST"];
  return allowed[resource] ?? [];
}
async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const resource = path.join("/");
  if (!methods(resource).includes(request.method))
    return NextResponse.json({ detail: "Recurso indisponível." }, { status: 404 });
  if (request.method !== "GET") {
    const origin =
      process.env["APP_ORIGIN"] ??
      (process.env.NODE_ENV === "development" ? request.nextUrl.origin : undefined);
    if (
      !origin ||
      request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return NextResponse.json({ detail: "Origem não permitida." }, { status: 403 });
  }
  const headers = new Headers();
  const origin = request.headers.get("origin");
  if (origin) headers.set("Origin", origin);
  const token = request.cookies.get(PLATFORM_COOKIE)?.value;
  if (token && /^[A-Za-z0-9_-]{20,200}$/.test(token))
    headers.set("Cookie", `${PLATFORM_COOKIE}=${token}`);
  try {
    let body: string | undefined;
    if (request.method !== "GET") {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return NextResponse.json({ detail: "Envie JSON." }, { status: 415 });
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader)
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (
            size >
            (resource === "knowledge/imports"
              ? 524288
              : resource.startsWith("knowledge")
                ? 131072
                : 16384)
          ) {
            await reader.cancel();
            return NextResponse.json({ detail: "Solicitação muito grande." }, { status: 413 });
          }
          chunks.push(chunk.value);
        }
      body = Buffer.concat(chunks).toString("utf8");
      headers.set("Content-Type", "application/json");
    }
    const query = new URLSearchParams();
    if (["companies", "knowledge", "knowledge/imports", "administrators"].includes(resource))
      for (const key of ["q", "status", "kind", "category", "offset", "limit"]) {
        const value = request.nextUrl.searchParams.get(key);
        if (value !== null) query.set(key, value);
      }
    const upstream = await fetch(
      backendUrl(`/api/v1/platform/${resource}${query.size ? `?${query}` : ""}`),
      {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        ...(body === undefined ? {} : { body }),
      },
    );
    const response = new NextResponse(upstream.status === 204 ? null : await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
    for (const cookie of upstream.headers.getSetCookie()) {
      if (cookie.startsWith(`${PLATFORM_COOKIE}=`))
        response.headers.append("Set-Cookie", cookie.replace(/;\s*Path=[^;]*/i, "; Path=/"));
    }
    const retry = upstream.headers.get("retry-after");
    if (retry) response.headers.set("Retry-After", retry);
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Serviço indisponível. Tente novamente em instantes." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export { forward as GET, forward as POST, forward as PATCH };
