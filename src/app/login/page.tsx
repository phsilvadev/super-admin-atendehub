import styles from "@/components/auth/auth-layout.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Boxes, Building2, BookOpen, Activity, ArrowUpRight } from "lucide-react";
import { PLATFORM_COOKIE } from "@/lib/auth/contracts";
import { readSession } from "@/lib/auth/server";
import { LoginForm } from "@/components/auth/login-form";
export const metadata = { title: "Entrar" };
const features = [
  { icon: Building2, title: "Empresas", text: "Organize os clientes da sua plataforma." },
  { icon: BookOpen, title: "Conhecimento", text: "Cuide da base que orienta o atendimento." },
  { icon: Activity, title: "Operação", text: "Acompanhe sua plataforma de perto." },
];
export default async function LoginPage() {
  const session = await readSession((await cookies()).get(PLATFORM_COOKIE)?.value);
  if (session.status === "authenticated") redirect("/empresas");
  return (
    <main className="min-h-dvh bg-card">
      <div className={`${styles["shell"]} bg-card`}>
        <aside
          className={`${styles["visual"]} relative flex-col justify-between overflow-hidden rounded-[26px] bg-sidebar text-sidebar-foreground`}
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 55% 25%, color-mix(in oklch, var(--brand) 62%, transparent), transparent 64%), radial-gradient(ellipse at 90% 65%, color-mix(in oklch, var(--accent) 35%, transparent), transparent 65%), radial-gradient(ellipse at 0% 100%, color-mix(in oklch, var(--brand) 60%, transparent), transparent 65%)",
          }}
        >
          <div className="relative z-10 flex items-center gap-2.5">
            <Boxes className="size-6 text-accent" />
            <span className="text-lg font-semibold tracking-tight">AtendeHub</span>
            <span className="ml-auto rounded-full border border-sidebar-foreground/20 px-3 py-1.5 text-[10px] font-medium tracking-wide text-sidebar-foreground/80">
              Superadmin
            </span>
          </div>
          <div className={`${styles["visualBody"]} relative z-10`}>
            <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-foreground/15 bg-sidebar-foreground/10 px-3 py-1.5 text-xs">
              <span className="size-1.5 rounded-full bg-accent" />
              Sua plataforma, por inteiro
            </span>
            <h2
              className={`${styles["headline"]} mt-5 max-w-xl font-medium leading-[1.08] tracking-[-0.045em]`}
            >
              Tudo conectado.
              <br />
              Você no controle.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-sidebar-foreground/70">
              Empresas, conhecimento e operação.
              <br />
              Um só lugar para cuidar de cada detalhe.
            </p>
            <div className={`${styles["featureGrid"]} grid grid-cols-3 gap-3`}>
              {features.map(({ icon: Icon, title, text }, index) => (
                <div
                  key={title}
                  className={`${styles["feature"]} flex flex-col justify-between rounded-2xl border p-4 ${index === 0 ? "border-card bg-card text-card-foreground" : "border-sidebar-foreground/10 bg-sidebar-foreground/10 text-sidebar-foreground"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid size-7 place-items-center rounded-full ${index === 0 ? "bg-brand text-brand-foreground" : "bg-sidebar-foreground/10"}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <ArrowUpRight
                      className={`size-3.5 ${index === 0 ? "text-muted-foreground" : "text-sidebar-foreground/40"}`}
                    />
                  </div>
                  <div>
                    <h3 className="mt-6 text-xs font-semibold">{title}</h3>
                    <p
                      className={`mt-1.5 text-[11px] leading-4 ${index === 0 ? "text-muted-foreground" : "text-sidebar-foreground/65"}`}
                    >
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-7 text-[10px] text-sidebar-foreground/45">
              AtendeHub · Administração da plataforma
            </p>
          </div>
        </aside>
        <section className={styles["formColumn"]}>
          <div className={`${styles["mobileBrand"]} text-sm font-semibold`}>
            <Boxes className="size-5 text-brand" />
            AtendeHub
            <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
              Superadmin
            </span>
          </div>
          <div className={styles["formArea"]}>
            <LoginForm />
          </div>
          <p className={`${styles["footer"]} text-center text-[11px] text-muted-foreground`}>
            Ambiente de administração · Acesso restrito
          </p>
        </section>
      </div>
    </main>
  );
}
