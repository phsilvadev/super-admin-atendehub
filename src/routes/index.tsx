import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Building2, FlaskConical, Layers, Cpu, Clock, PlugZap, FileClock, Upload, FileText,
  CheckCircle2, Archive, Activity, AlertTriangle, BarChart3, History, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/page-placeholder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Superadmin" },
      { name: "description", content: "Visão geral de empresas, assinaturas, IA e base de conhecimento." },
      { property: "og:title", content: "Dashboard — Superadmin" },
      { property: "og:description", content: "Visão geral de empresas, assinaturas, IA e base de conhecimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Ico = typeof Building2;

function Kpi({ icon: Icon, label, hint }: { icon: Ico; label: string; hint: string }) {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4" />{label}</div>
      <p className="text-2xl font-semibold text-muted-foreground">—</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children, dark }: { title: string; icon: Ico; children: ReactNode; dark?: boolean }) {
  return (
    <section className={dark ? "space-y-4 rounded-2xl bg-inverse p-5 text-inverse-foreground shadow-float" : "space-y-4 rounded-2xl border bg-card p-5 shadow-card"}>
      <h2 className="flex items-center gap-2 text-base font-medium"><Icon className="size-4" />{title}</h2>
      {children}
    </section>
  );
}

function Row({ icon: Icon, label, dark }: { icon: Ico; label: string; dark?: boolean }) {
  return (
    <div className={dark ? "flex items-center justify-between border-b border-inverse-border py-2.5 text-sm last:border-0" : "flex items-center justify-between border-b py-2.5 text-sm last:border-0"}>
      <span className={dark ? "flex items-center gap-2 text-inverse-muted" : "flex items-center gap-2 text-muted-foreground"}><Icon className="size-4" />{label}</span>
      <span className="font-semibold">—</span>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral da plataforma para o superadministrador.</p>
      </header>

      <div className="flex items-start gap-2 rounded-xl bg-accent/40 p-3 text-sm text-accent-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        Os dados financeiros aparecerão quando a cobrança estiver integrada.
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label="Empresas ativas" hint="Aguardando dados" />
        <Kpi icon={FlaskConical} label="Empresas em teste" hint="Aguardando dados" />
        <Kpi icon={Layers} label="Assinaturas por plano" hint="Disponível com a cobrança" />
        <Kpi icon={Cpu} label="Consumo e custo de IA" hint="Aguardando dados" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pendências" icon={AlertTriangle}>
          <Row icon={Clock} label="Testes próximos do vencimento" />
          <Row icon={PlugZap} label="Falhas de integração" />
          <Row icon={FileClock} label="Conteúdos aguardando revisão" />
        </Panel>

        <Panel title="Base de conhecimento" icon={FileText}>
          <Row icon={Upload} label="Importações recentes" />
          <Row icon={FileText} label="Rascunhos extraídos" />
          <Row icon={CheckCircle2} label="Conteúdos publicados" />
          <Row icon={Archive} label="Conteúdos desativados" />
        </Panel>

        <Panel title="Operação" icon={Activity} dark>
          <div className="flex items-center justify-between py-2.5 text-sm">
            <span className="flex items-center gap-2 text-inverse-muted"><Cpu className="size-4" />Situação da OpenAI</span>
            <Badge variant="dark" className="border-inverse-border">Não verificada</Badge>
          </div>
          <Row dark icon={AlertTriangle} label="Erros de processamento" />
          <Row dark icon={BarChart3} label="Uso por empresa" />
        </Panel>

        <Panel title="Últimas atividades" icon={History}>
          <div className="flex flex-wrap gap-2">
            <Badge variant="green">Novas empresas</Badge>
            <Badge variant="blue">Alterações de plano</Badge>
            <Badge variant="pink">Publicações na base comum</Badge>
          </div>
          <EmptyState text="Nenhuma atividade registrada ainda." />
        </Panel>
      </div>
    </div>
  );
}
