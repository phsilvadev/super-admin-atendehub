"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import type { Identity } from "@/lib/auth/contracts";
import type { ReactNode } from "react";
import {
  LayoutGrid,
  Building2,
  Layers,
  Cpu,
  BookOpen,
  Upload,
  ShieldCheck,
  Settings,
  Boxes,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/planos", label: "Planos", icon: Layers },
  { to: "/consumo-ia", label: "Consumo de IA", icon: Cpu },
  { to: "/base-conhecimento", label: "Base de conhecimento", icon: BookOpen },
  { to: "/importacoes", label: "Importações", icon: Upload },
  { to: "/auditoria", label: "Auditoria", icon: ShieldCheck },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children, identity }: { children: ReactNode; identity: Identity }) {
  const path = usePathname();
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  async function logout() {
    if (busy) return;
    setBusy(true);
    setLogoutError("");
    try {
      await api("auth/logout", {});
      window.location.replace("/login");
    } catch {
      setLogoutError("Não foi possível sair. Tente novamente.");
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen w-full gap-4 p-0 md:p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col rounded-2xl bg-sidebar p-3 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-3 py-4 text-lg font-semibold">
          <Boxes className="size-6" /> AtendeHub
        </div>
        <nav className="mt-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                path === to && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border px-3 pt-3 text-xs text-sidebar-foreground/60">
          Superadministrador
          <p className="mt-2 truncate text-sidebar-foreground">{identity.name}</p>
          <button
            type="button"
            disabled={busy}
            className="mt-3 underline"
            onClick={() => void logout()}
          >
            {busy ? "Saindo…" : "Sair da conta"}
          </button>
          {logoutError && (
            <p role="alert" className="mt-2">
              {logoutError}
            </p>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b bg-background md:hidden">
          <div className="flex items-center gap-2 px-4 py-3 font-semibold">
            <Boxes className="size-5" /> AtendeHub
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground",
                  path === to && "bg-primary text-primary-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex items-center justify-end gap-3 pb-4">
          <span className="text-xs text-muted-foreground">{identity.name}</span>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={busy}
            className="rounded-lg border bg-card px-3 py-2 text-xs md:hidden"
          >
            Sair
          </button>
          <span className="grid size-9 place-items-center rounded-full border bg-card text-muted-foreground">
            <Bell className="size-4" />
          </span>
        </div>
        <main className="px-4 py-6 md:px-2 md:py-0">{children}</main>
      </div>
    </div>
  );
}
