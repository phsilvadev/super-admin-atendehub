import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutGrid, Building2, Layers, Cpu, BookOpen, Upload, ShieldCheck, Settings, Boxes, Bell,
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

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex min-h-screen w-full gap-4 p-0 md:p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col rounded-2xl bg-sidebar p-3 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-3 py-4 text-lg font-semibold">
          <Boxes className="size-6" /> skillzone
        </div>
        <nav className="mt-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
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
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b bg-background md:hidden">
          <div className="flex items-center gap-2 px-4 py-3 font-semibold"><Boxes className="size-5" /> skillzone</div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
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
        <div className="hidden justify-end pb-4 md:flex">
          <span className="grid size-9 place-items-center rounded-full border bg-card text-muted-foreground"><Bell className="size-4" /></span>
        </div>
        <main className="px-4 py-6 md:px-2 md:py-0">{children}</main>
      </div>
    </div>
  );
}
