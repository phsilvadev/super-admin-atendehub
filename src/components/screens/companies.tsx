"use client";
import { useEffect, useState } from "react";
import {
  Building2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import {
  getCompanies,
  stateLabels,
  formatDate,
  taxId,
  type Companies,
  type CompanyState,
} from "@/lib/api/companies";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
const variants: Record<CompanyState, "green" | "yellow" | "pink" | "outline"> = {
  active: "green",
  trial: "yellow",
  trial_expired: "pink",
  inactive: "outline",
};
export function CompaniesScreen() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Companies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getCompanies(search, status, offset)
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e) => {
        if (!alive) return;
        setData(null);
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          window.location.replace("/login");
        else
          setError(
            e instanceof ApiError ? e.message : "Não foi possível validar a listagem de empresas.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [search, status, offset, revision]);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Gestão da plataforma
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe as distribuidoras que fazem parte do AtendeHub.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs text-muted-foreground">
          <Building2 className="size-3.5" />
          Visão da plataforma
        </span>
      </header>
      <section
        aria-label="Resumo das empresas"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {(
          [
            ["active", "Empresas ativas"],
            ["trial", "Em teste gratuito"],
            ["trial_expired", "Testes encerrados"],
            ["inactive", "Empresas inativas"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-3 h-8 w-14" />
            ) : (
              <p
                className="mt-3 text-3xl font-semibold"
                aria-label={`${label}: ${data?.summary[key] ?? "indisponível"}`}
              >
                {data?.summary[key] ?? "—"}
              </p>
            )}
          </div>
        ))}
      </section>
      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              aria-label="Buscar empresa"
              value={query}
              maxLength={100}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, CNPJ ou e-mail…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <select
            aria-label="Filtrar status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            className="h-10 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="all">Todos os status</option>
            {Object.entries(stateLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-xl"
            aria-label="Atualizar empresas"
            disabled={loading}
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {error ? (
          <div role="alert" className="space-y-4 p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : loading ? (
          <div role="status" aria-label="Carregando empresas" className="space-y-4 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center gap-3 p-14 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/30">
              <Building2 className="size-5 text-brand" />
            </span>
            <h2 className="font-medium">
              {search || status !== "all"
                ? "Nenhuma empresa encontrada"
                : "Nenhuma empresa cadastrada"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {search || status !== "all"
                ? "Ajuste a busca ou o filtro."
                : "As distribuidoras cadastradas aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  {["Empresa", "Administrador", "Plano", "Status", "Cadastro", "Fim do teste"].map(
                    (label) => (
                      <th key={label} className="px-5 py-4 font-medium">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((company) => (
                  <tr key={company.id} className="hover:bg-muted/20">
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl border bg-muted/40">
                          <Building2 className="size-4 text-muted-foreground" />
                        </span>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {company.tax_id ? taxId(company.tax_id) : "CNPJ não informado"}
                          </p>
                          {company.email && (
                            <p className="mt-1 text-xs text-muted-foreground">{company.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <p>{company.administrator?.name ?? "Não informado"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {company.administrator?.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      <Badge variant="blue">{company.plan_name}</Badge>
                    </td>
                    <td className="px-5 py-5">
                      <Badge variant={variants[company.status]}>
                        {stateLabels[company.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-xs text-muted-foreground">
                      {formatDate(company.registered_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-xs text-muted-foreground">
                      {formatDate(company.trial_ends_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
          <p>
            {loading
              ? "Consultando empresas…"
              : data?.total
                ? `Mostrando ${offset + 1}–${Math.min(offset + 20, data.total)} de ${data.total} empresas`
                : "Nenhum resultado"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-label="Página anterior"
              disabled={loading || offset === 0}
              onClick={() => setOffset((v) => Math.max(0, v - 20))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="Próxima página"
              disabled={loading || !data || offset + 20 >= data.total}
              onClick={() => setOffset((v) => v + 20)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </section>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowUpRight className="size-3.5" />
        Consulta das distribuidoras cadastradas na plataforma.
      </p>
    </div>
  );
}
