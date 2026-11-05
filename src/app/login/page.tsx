import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Boxes, Building2, BookOpen, Activity } from "lucide-react";
import { PLATFORM_COOKIE } from "@/lib/auth/contracts";
import { readSession } from "@/lib/auth/server";
import { LoginForm } from "@/components/auth/login-form";
export const metadata = { title: "Entrar" };
export default async function LoginPage() {
  const session = await readSession((await cookies()).get(PLATFORM_COOKIE)?.value);
  if (session.status === "authenticated") redirect("/empresas");
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 text-xl font-semibold">
          <Boxes className="size-7 text-accent" />
          AtendeHub
          <span className="ml-2 rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/60">
            Superadmin
          </span>
        </div>
        <div className="relative z-10 max-w-lg py-16">
          <p className="mb-6 text-sm text-accent">Uma plataforma. Toda a operação.</p>
          <h2 className="text-5xl font-semibold leading-[1.12] tracking-tight">
            Mais clareza para
            <br />
            cada decisão.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-sidebar-foreground/60">
            Empresas, conhecimento e operação reunidos em um só lugar.
          </p>
          <div className="mt-10 space-y-5">
            {[
              [Building2, "Empresas e assinaturas"],
              [BookOpen, "Conhecimento do setor"],
              [Activity, "Visão da plataforma"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Boxes;
              return (
                <div
                  key={String(label)}
                  className="flex items-center gap-3 text-sm text-sidebar-foreground/80"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-sidebar-accent">
                    <I className="size-4 text-accent" />
                  </span>
                  {String(label)}
                </div>
              );
            })}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -right-40 size-[500px] rounded-full bg-brand/15 blur-3xl"
        />
        <p className="relative text-xs text-sidebar-foreground/40">
          AtendeHub · Administração da plataforma
        </p>
      </aside>
      <section className="flex flex-col justify-between p-6 sm:p-12">
        <div className="flex items-center gap-2 font-semibold lg:invisible">
          <Boxes className="size-6" />
          AtendeHub
        </div>
        <div className="py-12">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Ambiente de administração · Acesso restrito
        </p>
      </section>
    </main>
  );
}
