"use client";
import { useEffect, useState } from "react";
import {
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Activity,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  getUsage,
  getPrices,
  addPrice,
  applyPrice,
  usd,
  count,
  pricingLabels,
  stateLabels,
  localDate,
  initialStart,
  type Usage,
  type Price,
} from "@/lib/api/ai-usage";
import { errorMessage } from "@/lib/api/knowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
const selectClass = "h-10 min-w-0 max-w-full rounded-xl border bg-background px-3 text-sm";
const stamp = (value: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value * 1000));
export function AIUsageScreen() {
  const [data, setData] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(localDate);
  const [company, setCompany] = useState("");
  const [user, setUser] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("all");
  const [pricing, setPricing] = useState("all");
  const [offset, setOffset] = useState(0);
  const [updated, setUpdated] = useState<Date | null>(null);
  useEffect(() => {
    let alive = true,
      running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setLoading(true);
    if (!start || !end) {
      setData(null);
      setLoading(false);
      setError("Informe a data inicial e a data final.");
      return;
    }
    async function load() {
      if (!alive || running) return;
      if (document.visibilityState === "hidden") return;
      running = true;
      setRefreshing(true);
      clearTimeout(timer);
      try {
        const result = await getUsage({
          start,
          end,
          company_id: company,
          user_id: user,
          model,
          status,
          pricing,
          offset: String(offset),
          limit: "20",
        });
        if (alive) {
          setData(result);
          setError("");
          setUpdated(new Date());
        }
      } catch (e) {
        if (alive) {
          setData(null);
          setError(errorMessage(e));
        }
      } finally {
        running = false;
        if (alive) {
          setLoading(false);
          setRefreshing(false);
          timer = setTimeout(() => void load(), 30000);
        }
      }
    }
    // Empty optional IDs are omitted; FastAPI rejects empty UUID strings.
    void load();
    const wake = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [start, end, company, user, model, status, pricing, offset, revision]);
  function resetPage() {
    setOffset(0);
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Uso da plataforma
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Consumo de IA</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe chamadas, tokens e gasto estimado em dólar.
          </p>
        </div>
        <Button variant="outline" disabled={refreshing} onClick={() => setRevision((v) => v + 1)}>
          <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar consumo
        </Button>
      </header>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Consumo</TabsTrigger>
          <TabsTrigger value="prices">Tarifas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-5 space-y-5">
          <section
            aria-label="Filtros de consumo"
            className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <label className="space-y-1.5 text-xs text-muted-foreground">
              <span>De</span>
              <Input
                aria-label="Data inicial"
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  resetPage();
                }}
              />
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              <span>Até</span>
              <Input
                aria-label="Data final"
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  resetPage();
                }}
              />
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              <span>Empresa</span>
              <select
                aria-label="Filtrar empresa"
                className={selectClass + " w-full"}
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setUser("");
                  resetPage();
                }}
              >
                <option value="">Todas as empresas</option>
                {data?.companies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              <span>Usuário</span>
              <select
                aria-label="Filtrar usuário"
                className={selectClass + " w-full"}
                value={user}
                disabled={!company}
                onChange={(e) => {
                  setUser(e.target.value);
                  resetPage();
                }}
              >
                <option value="">{company ? "Todos os usuários" : "Selecione uma empresa"}</option>
                {data?.users.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <select
              aria-label="Filtrar modelo"
              className={selectClass}
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                resetPage();
              }}
            >
              <option value="">Todos os modelos</option>
              {data?.models.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar status"
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                resetPage();
              }}
            >
              <option value="all">Todos os status</option>
              {Object.entries(stateLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar cálculo"
              className={selectClass}
              value={pricing}
              onChange={(e) => {
                setPricing(e.target.value);
                resetPage();
              }}
            >
              <option value="all">Todos os cálculos</option>
              <option value="valued">Com gasto estimado</option>
              <option value="unknown">Sem custo calculável</option>
            </select>
            <p className="self-center text-xs text-muted-foreground">
              Horário de Brasília · atualização a cada 30s
              {updated && (
                <span className="mt-1 block">
                  Última atualização:{" "}
                  {updated.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </span>
              )}
            </p>
          </section>
          {error ? (
            <div role="alert" className="space-y-3 rounded-xl border p-5 text-sm">
              <p>{error}</p>
              <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <section
                aria-label="Indicadores de consumo"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                {[
                  {
                    label: "Gasto estimado",
                    value: data ? usd(data.summary.estimated_cost_usd) : "—",
                    detail: data?.summary.unpriced_requests
                      ? `Subtotal · ${count(data.summary.unpriced_requests)} chamadas sem custo calculável`
                      : "USD · não é a fatura da OpenAI",
                    icon: Coins,
                  },
                  {
                    label: "Chamadas",
                    value: data ? count(data.summary.requests) : "—",
                    detail: data
                      ? `${count(data.summary.measured_requests)} com medição de tokens`
                      : "",
                    icon: Activity,
                  },
                  {
                    label: "Tokens de entrada",
                    value: data ? count(data.summary.input_tokens) : "—",
                    detail: data
                      ? `${count(data.summary.cached_tokens)} tokens de cache informados`
                      : "",
                    icon: ArrowDownLeft,
                  },
                  {
                    label: "Tokens de saída",
                    value: data ? count(data.summary.output_tokens) : "—",
                    detail: data
                      ? `${count(data.summary.unmeasured_requests)} chamadas sem medição completa`
                      : "",
                    icon: ArrowUpRight,
                  },
                ].map(({ label, value, detail, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    {loading ? (
                      <Skeleton className="my-3 h-8 w-24" />
                    ) : (
                      <p
                        className="my-3 break-words text-xl font-semibold"
                        aria-label={`${label}: ${value}`}
                      >
                        {value}
                      </p>
                    )}
                    <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </section>
              {!!data?.summary.unpriced_requests && (
                <p className="rounded-xl border bg-card p-4 text-sm">
                  Há chamadas sem medição, sem tarifa ou com modalidade não suportada. Elas não
                  foram tratadas como custo zero.
                </p>
              )}
              <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
                <header className="border-b p-5">
                  <h2 className="font-semibold">Consumo por empresa</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Até 20 empresas com maior gasto calculável no período filtrado.
                  </p>
                </header>
                {loading ? (
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                  </div>
                ) : !data?.by_company.length ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum consumo registrado neste período.
                  </p>
                ) : (
                  <div className="divide-y">
                    {data.by_company.map((row) => (
                      <div
                        key={row.company_id}
                        className="flex flex-wrap items-center justify-between gap-3 p-5"
                      >
                        <div>
                          <p className="text-sm font-medium">{row.company_name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {count(row.requests)} chamadas ·{" "}
                            {count(row.input_tokens + row.output_tokens)} tokens informados
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{usd(row.cost_usd)}</p>
                          {!!row.unpriced && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {row.unpriced} sem custo calculável
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
                <header className="border-b p-5">
                  <h2 className="font-semibold">Chamadas registradas</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sem acesso ao texto das conversas ou às credenciais.
                  </p>
                </header>
                {loading ? (
                  <div role="status" aria-label="Carregando consumo" className="space-y-3 p-5">
                    {[1, 2, 3].map((i) => (
                      <Skeleton className="h-16" key={i} />
                    ))}
                  </div>
                ) : !data?.items.length ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    Nenhuma chamada encontrada.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-xs">
                      <thead className="border-b bg-muted/20 text-muted-foreground">
                        <tr>
                          {[
                            "Data",
                            "Empresa / usuário",
                            "Recurso / modelo",
                            "Entrada",
                            "Cache",
                            "Saída",
                            "Status",
                            "Gasto estimado",
                          ].map((label) => (
                            <th key={label} className="px-4 py-3 font-medium">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.items.map((row) => (
                          <tr key={row.id}>
                            <td className="whitespace-nowrap px-4 py-4">{stamp(row.created_at)}</td>
                            <td className="px-4 py-4">
                              <p className="font-medium">{row.company_name}</p>
                              <p className="mt-1 text-muted-foreground">{row.user_name}</p>
                            </td>
                            <td className="px-4 py-4">
                              <p>
                                {row.feature === "support" ? "Suporte da plataforma" : row.feature}
                              </p>
                              <p className="mt-1 break-all text-muted-foreground">
                                {row.resolved_model ?? row.model}
                              </p>
                            </td>
                            <td className="px-4 py-4">{count(row.input_tokens)}</td>
                            <td className="px-4 py-4">{count(row.cached_tokens)}</td>
                            <td className="px-4 py-4">{count(row.output_tokens)}</td>
                            <td className="px-4 py-4">
                              <Badge
                                variant={
                                  row.status === "complete"
                                    ? "green"
                                    : row.status === "processing"
                                      ? "outline"
                                      : "yellow"
                                }
                              >
                                {stateLabels[row.status] ?? row.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <p
                                className="whitespace-nowrap font-medium"
                                title={row.cost_usd ?? undefined}
                              >
                                {usd(row.cost_usd)}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {pricingLabels[row.pricing_status] ?? row.pricing_status}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <footer className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
                  <span>
                    {data?.total ?? 0} chamadas · página {offset / 20 + 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Chamadas anteriores"
                      disabled={loading || offset === 0}
                      onClick={() => setOffset((v) => Math.max(0, v - 20))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Próximas chamadas"
                      disabled={loading || !data || offset + 20 >= data.total}
                      onClick={() => setOffset((v) => v + 20)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </footer>
              </section>
            </>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Inclui as chamadas instrumentadas pela plataforma; atualmente, o chat de suporte.
            Diagnósticos de acesso não geram tokens. Não inclui usos externos da sua conta OpenAI,
            impostos, câmbio ou descontos da fatura. Cache não informado é estimado pela tarifa
            integral de entrada; registros antigos são identificados. Alterações de tarifa não
            sobrescrevem custos já calculados.
          </p>
        </TabsContent>
        <TabsContent value="prices" className="mt-5">
          <Prices onChanged={() => setRevision((v) => v + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
function Prices({ onChanged }: { onChanged: () => void }) {
  const [data, setData] = useState<{ items: Price[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ price: Price | null } | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getPrices(offset)
      .then((value) => {
        if (alive) setData(value);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [offset, revision]);
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="font-semibold">Tarifas dos modelos</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            USD por 1 milhão de tokens · modalidade padrão · versões preservadas.
          </p>
        </div>
        <Button onClick={() => setEditor({ price: null })}>
          <Plus className="mr-2 size-4" />
          Nova tarifa
        </Button>
      </header>
      {notice && (
        <p role="status" className="m-4 rounded-xl border p-3 text-sm">
          {notice}
        </p>
      )}
      {error ? (
        <div role="alert" className="space-y-3 p-5">
          <p className="text-sm">{error}</p>
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="border-b bg-muted/20 text-muted-foreground">
              <tr>
                {["Modelo", "Entrada", "Cache", "Saída", "Vigência UTC", "Fonte", "Ação"].map(
                  (label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map((price) => (
                <tr key={price.id}>
                  <td className="px-4 py-4 font-medium">{price.model}</td>
                  <td className="px-4 py-4">{usd(price.input_usd)}</td>
                  <td className="px-4 py-4">{usd(price.cached_usd)}</td>
                  <td className="px-4 py-4">{usd(price.output_usd)}</td>
                  <td className="px-4 py-4">
                    {new Date(price.effective_from * 1000).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={price.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Ver fonte
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <Button size="sm" variant="outline" onClick={() => setEditor({ price })}>
                      Aplicar pendentes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
        <span>{data?.total ?? 0} tarifas</span>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label="Tarifas anteriores"
            disabled={loading || offset === 0}
            onClick={() => setOffset((v) => Math.max(0, v - 20))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Próximas tarifas"
            disabled={loading || !data || offset + 20 >= data.total}
            onClick={() => setOffset((v) => v + 20)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </footer>
      {editor && (
        <PriceEditor
          price={editor.price}
          onClose={() => setEditor(null)}
          onSaved={(applied, remaining) => {
            setEditor(null);
            setNotice(
              `Tarifa registrada/aplicada. ${applied} registros calculados.${remaining ? ` Restam ${remaining}; use Aplicar pendentes novamente.` : ""}`,
            );
            setRevision((v) => v + 1);
            onChanged();
          }}
        />
      )}
    </section>
  );
}
function PriceEditor({
  price,
  onClose,
  onSaved,
}: {
  price: Price | null;
  onClose: () => void;
  onSaved: (applied: number, remaining: number) => void;
}) {
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [cached, setCached] = useState("");
  const [output, setOutput] = useState("");
  const [effective, setEffective] = useState(localDate);
  const [source, setSource] = useState("https://developers.openai.com/api/docs/pricing");
  const [apply, setApply] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const value = price
        ? await applyPrice(price, password)
        : await addPrice({
            model,
            input_usd: input,
            cached_usd: cached,
            output_usd: output,
            effective_from: effective,
            source_url: source,
            apply_to_unpriced: apply,
            current_password: password,
          });
      setPassword("");
      onSaved(value.applied_records, value.remaining_records);
    } catch (e) {
      setError(errorMessage(e));
      setPassword("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {price ? "Aplicar tarifa a pendentes" : "Nova tarifa de modelo"}
          </DialogTitle>
          <DialogDescription>
            {price
              ? `${price.model}: calcular registros sem tarifa, respeitando a vigência e preservando os já calculados.`
              : "Cadastre a tarifa padrão publicada pelo provedor em USD por milhão de tokens. Não altera versões anteriores."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="space-y-4"
        >
          <fieldset disabled={busy} className="space-y-4">
            {!price && (
              <>
                <label className="block space-y-1.5 text-sm">
                  <span>Modelo</span>
                  <Input
                    required
                    maxLength={120}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Entrada", input, setInput],
                    ["Cache", cached, setCached],
                    ["Saída", output, setOutput],
                  ].map(([label, value, setter]) => (
                    <label key={label as string} className="block space-y-1.5 text-xs">
                      <span>{label as string} USD / 1M</span>
                      <Input
                        required
                        type="number"
                        min="0"
                        max="100000"
                        step="0.00000001"
                        value={value as string}
                        onChange={(e) => (setter as (value: string) => void)(e.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <label className="block space-y-1.5 text-sm">
                  <span>Vigência (UTC)</span>
                  <Input
                    required
                    type="date"
                    min="2000-01-01"
                    max="2100-12-31"
                    value={effective}
                    onChange={(e) => setEffective(e.target.value)}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span>Fonte oficial</span>
                  <Input
                    required
                    type="url"
                    maxLength={1000}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={apply}
                    onChange={(e) => setApply(e.target.checked)}
                  />
                  Aplicar também aos registros ainda sem tarifa
                </label>
              </>
            )}
            <label className="block space-y-1.5 border-t pt-4 text-sm">
              <span>Sua senha de superadministrador</span>
              <Input
                aria-label="Sua senha atual"
                required
                type="password"
                maxLength={128}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !password}>
              {busy ? "Salvando…" : price ? "Aplicar tarifa" : "Salvar tarifa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
