"use client";
import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api/client";
import { identitySchema } from "@/lib/auth/contracts";
export function SessionGuard({ id, children }: { id: string; children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    let alive = true;
    let busy = false;
    async function check() {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const parsed = identitySchema.safeParse(await api("auth/me"));
        if (!parsed.success || parsed.data.id !== id) {
          if (alive) setBlocked(true);
          window.location.replace("/login");
          return;
        }
        if (alive) setBlocked(false);
      } catch (e) {
        if (alive) setBlocked(true);
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          window.location.replace("/login");
      } finally {
        busy = false;
      }
    }
    void check();
    const timer = setInterval(() => void check(), 30000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [id]);
  return blocked ? (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-semibold">Não foi possível validar seu acesso</h1>
        <p className="text-muted-foreground">Verifique sua conexão e tente novamente.</p>
        <a className="underline" href="/empresas">
          Tentar novamente
        </a>
      </div>
    </main>
  ) : (
    children
  );
}
