import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/server";
import { PLATFORM_COOKIE } from "@/lib/auth/contracts";
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    path === "/login" ||
    path === "/servico-indisponivel" ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path.startsWith("/api/")
  )
    return NextResponse.next();
  const result = await readSession(request.cookies.get(PLATFORM_COOKIE)?.value);
  if (result.status === "anonymous")
    return NextResponse.redirect(new URL("/login", process.env["APP_ORIGIN"] ?? request.url));
  if (result.status === "unavailable")
    return new NextResponse(
      '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Serviço indisponível</title><body><h1>Não foi possível validar seu acesso</h1><p>Tente novamente em instantes.</p><a href="/empresas">Tentar novamente</a></body></html>',
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      },
    );
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/).*)"] };
