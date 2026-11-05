import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLATFORM_COOKIE, identitySchema } from "./contracts";
export function backendUrl(path: string) {
  const base = new URL(process.env["BACKEND_URL"] ?? "http://127.0.0.1:8000");
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password)
    throw new Error("Backend inválido");
  return new URL(path, base);
}
export async function readSession(token?: string) {
  if (!token || !/^[A-Za-z0-9_-]{20,200}$/.test(token)) return { status: "anonymous" } as const;
  try {
    const response = await fetch(backendUrl("/api/v1/platform/auth/me"), {
      headers: { Cookie: `${PLATFORM_COOKIE}=${token}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401 || response.status === 403) return { status: "anonymous" } as const;
    if (!response.ok) return { status: "unavailable" } as const;
    const identity = identitySchema.safeParse(await response.json());
    return identity.success
      ? ({ status: "authenticated", identity: identity.data } as const)
      : ({ status: "unavailable" } as const);
  } catch {
    return { status: "unavailable" } as const;
  }
}
export async function requirePlatform() {
  const session = await readSession((await cookies()).get(PLATFORM_COOKIE)?.value);
  if (session.status === "anonymous") redirect("/login");
  if (session.status === "unavailable") redirect("/servico-indisponivel");
  return session.identity;
}
