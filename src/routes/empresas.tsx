import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Building2, Info, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — Superadmin" },
      { name: "description", content: "Cadastre e acompanhe as empresas clientes da plataforma." },
      { property: "og:title", content: "Empresas — Superadmin" },
      { property: "og:description", content: "Cadastre e acompanhe as empresas clientes da plataforma." },
    ],
  }),
  component: Empresas,
});

type Status = "ativa" | "teste" | "inativa";
type Empresa = {
  id: string; nome: string; cnpj: string; responsavel: string; email: string;
  plano: string; status: Status; fimTeste: string; criadaEm: string;
};

const statusBadge: Record<Status, { label: string; variant: "green" | "yellow" | "pink" }> = {
  ativa: { label: "Ativa", variant: "green" },
  teste: { label: "Em teste", variant: "yellow" },
  inativa: { label: "Inativa", variant: "pink" },
};
const planos = ["Básico", "Profissional", "Empresarial"];
const vazio = { nome: "", cnpj: "", responsavel: "", email: "", plano: "Básico", status: "teste" as Status, fimTeste: "" };

function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todas" | Status>("todas");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState<string | null>(null);

  const lista = useMemo(() => empresas.filter((e) =>
    (filtro === "todas" || e.status === filtro) &&
    `${e.nome} ${e.cnpj} ${e.email}`.toLowerCase().includes(busca.toLowerCase())), [empresas, busca, filtro]);

  const contagem = (s: Status) => empresas.filter((e) => e.status === s).length;

  function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    if (editId) setEmpresas((l) => l.map((e) => (e.id === editId ? { ...e, ...form } : e)));
    else setEmpresas((l) => [{ ...form, id: crypto.randomUUID(), criadaEm: new Date().toLocaleDateString("pt-BR") }, ...l]);
    setAberto(false);
  }
  function novo() { setEditId(null); setForm(vazio); setAberto(true); }
  function editar(e: Empresa) { setEditId(e.id); setForm(e); setAberto(true); }
  const set = (k: keyof typeof vazio) => (ev: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: ev.target.value });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre e acompanhe as empresas clientes da plataforma.</p>
        </div>
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild><Button onClick={novo}><Plus /> Nova empresa</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar empresa" : "Nova empresa"}</DialogTitle>
              <DialogDescription>Preencha os dados principais da empresa.</DialogDescription>
            </DialogHeader>
            <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="nome">Nome da empresa</Label><Input id="nome" required value={form.nome} onChange={set("nome")} /></div>
              <div className="space-y-2"><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={set("cnpj")} /></div>
              <div className="space-y-2"><Label htmlFor="resp">Responsável</Label><Input id="resp" value={form.responsavel} onChange={set("responsavel")} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="email">E-mail do responsável</Label><Input id="email" type="email" required value={form.email} onChange={set("email")} /></div>
              <div className="space-y-2"><Label>Plano</Label>
                <Select value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{planos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(statusBadge) as Status[]).map((s) => <SelectItem key={s} value={s}>{statusBadge[s].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.status === "teste" && (
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="fim">Fim do teste</Label><Input id="fim" type="date" value={form.fimTeste} onChange={set("fimTeste")} /></div>
              )}
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
                <Button type="submit">{editId ? "Salvar alterações" : "Cadastrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex items-start gap-2 rounded-xl bg-accent/40 p-3 text-sm text-accent-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        Prévia da tela: os cadastros ainda não são salvos e somem ao recarregar a página.
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(statusBadge) as Status[]).map((s) => (
          <div key={s} className="rounded-2xl border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground sm:text-sm">{s === "teste" ? "Em teste" : `${statusBadge[s].label}s`}</p>
            <p className="mt-1 text-2xl font-semibold">{contagem(s)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="bg-card pl-9" placeholder="Buscar por nome, CNPJ ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
          <SelectTrigger className="bg-card sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            {(Object.keys(statusBadge) as Status[]).map((s) => <SelectItem key={s} value={s}>{statusBadge[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-4 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground"><Building2 className="size-5" /></span>
          <p className="font-medium">{empresas.length ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}</p>
          <p className="text-sm text-muted-foreground">{empresas.length ? "Ajuste a busca ou o filtro." : "Cadastre a primeira empresa para começar."}</p>
          {!empresas.length && <Button variant="outline" onClick={novo}><Plus /> Nova empresa</Button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
            <span>Empresa</span><span>Plano</span><span>Status</span><span>Cadastro</span><span className="w-8" />
          </div>
          {lista.map((e) => (
            <div key={e.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{e.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{e.email}{e.cnpj && ` · ${e.cnpj}`}</p>
                <div className="mt-2 flex gap-2 md:hidden"><Badge variant={statusBadge[e.status].variant}>{statusBadge[e.status].label}</Badge><Badge variant="outline">{e.plano}</Badge></div>
              </div>
              <span className="hidden text-sm md:block">{e.plano}</span>
              <span className="hidden md:block"><Badge variant={statusBadge[e.status].variant}>{statusBadge[e.status].label}</Badge>
                {e.status === "teste" && e.fimTeste && <span className="mt-1 block text-xs text-muted-foreground">até {new Date(e.fimTeste + "T00:00").toLocaleDateString("pt-BR")}</span>}
              </span>
              <span className="hidden text-sm text-muted-foreground md:block">{e.criadaEm}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => editar(e)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEmpresas((l) => l.map((x) => x.id === e.id ? { ...x, status: x.status === "inativa" ? "ativa" : "inativa" } : x))}>
                    {e.status === "inativa" ? "Reativar" : "Desativar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
