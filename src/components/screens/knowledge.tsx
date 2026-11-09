"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  ClipboardCheck,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntryEditor } from "@/components/knowledge/entry-editor";
import { ImportPanel } from "@/components/knowledge/import-panel";
import {
  type Library,
  type Entry,
  getLibrary,
  kinds,
  statusOf,
  statusLabels,
  errorMessage,
} from "@/lib/api/knowledge";
import { formatDate } from "@/lib/api/companies";
const variants = {
  draft: "yellow",
  pending: "yellow",
  published: "green",
  inactive: "outline",
} as const;
export function KnowledgeScreen({ initialTab = "library" }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Library | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<{ id: string | null } | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query);
      setOffset(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getLibrary({
      q: search,
      status: tab === "review" ? "review" : status,
      kind,
      category,
      offset: String(offset),
      limit: "20",
    })
      .then((value) => {
        if (alive) setData(value);
      })
      .catch((e) => {
        if (alive) {
          setData(null);
          setError(errorMessage(e));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [search, status, kind, category, offset, revision, tab]);
  function changeTab(value: string) {
    setTab(value);
    setOffset(0);
  }
  function open(entry: Entry) {
    setEditor({ id: entry.id });
  }
  const content = (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b p-4 sm:p-5">
        <div className="relative min-w-44 flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Buscar conteúdo"
            maxLength={100}
            className="h-10 rounded-xl pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar título, texto ou fonte…"
          />
        </div>
        {tab !== "review" && (
          <select
            aria-label="Filtrar status"
            className="h-10 max-w-full rounded-xl border bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
          >
            <option value="all">Todos os status</option>
            <option value="review">A revisar</option>
            <option value="published">Publicados</option>
            <option value="inactive">Desativados</option>
          </select>
        )}
        <select
          aria-label="Filtrar tipo"
          className="h-10 max-w-full rounded-xl border bg-background px-3 text-sm"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setOffset(0);
          }}
        >
          <option value="all">Todos os tipos</option>
          {Object.entries(kinds).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar categoria"
          className="h-10 max-w-full rounded-xl border bg-background px-3 text-sm"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setOffset(0);
          }}
        >
          <option value="">Todas as categorias</option>
          {data?.categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="icon"
          aria-label="Atualizar biblioteca"
          disabled={loading}
          onClick={() => setRevision((v) => v + 1)}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {loading ? (
        <div role="status" aria-label="Carregando biblioteca" className="space-y-4 p-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton className="h-20 rounded-xl" key={i} />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="space-y-4 p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl border bg-muted/30">
            <BookOpen className="size-5 text-muted-foreground" />
          </span>
          <h2 className="font-semibold">
            {search || status !== "all" || kind !== "all" || category
              ? "Nenhum conteúdo encontrado"
              : tab === "review"
                ? "Nenhum conteúdo aguardando revisão"
                : "Sua biblioteca começa aqui"}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {search || status !== "all" || kind !== "all" || category
              ? "Ajuste a busca ou os filtros para encontrar outros conteúdos."
              : tab === "review"
                ? "Os novos rascunhos e as alterações ainda não publicadas aparecerão aqui."
                : "Cadastre um texto técnico ou importe conversas autorizadas para começar a organizar o conhecimento do setor."}
          </p>
          {tab !== "review" && (
            <Button variant="outline" onClick={() => setEditor({ id: null })}>
              <Plus className="mr-2 size-4" />
              Criar primeiro conteúdo
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_130px_100px] gap-4 border-b bg-muted/20 px-5 py-3 text-xs text-muted-foreground lg:grid">
            <span>Conteúdo e fonte</span>
            <span>Categoria</span>
            <span>Status</span>
            <span>Atualização</span>
            <span className="text-right">Ação</span>
          </div>
          <div className="divide-y">
            {data.items.map((entry) => (
              <article
                key={entry.id}
                className="grid items-center gap-4 p-5 transition-colors hover:bg-muted/15 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_130px_100px]"
              >
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 hidden size-10 shrink-0 place-items-center rounded-xl border bg-muted/20 sm:grid">
                    <FileText className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <button
                      onClick={() => open(entry)}
                      className="text-left text-sm font-medium hover:underline"
                    >
                      {entry.title}
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {kinds[entry.kind]} · v{entry.current_revision}
                    </p>
                    <p
                      className="mt-1 truncate text-xs text-muted-foreground"
                      title={entry.source_reference}
                    >
                      Fonte: {entry.source_reference}
                    </p>
                  </div>
                </div>
                <p className="break-words text-sm text-muted-foreground">{entry.category}</p>
                <div>
                  <Badge variant={variants[statusOf(entry)]}>{statusLabels[statusOf(entry)]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-self-start lg:justify-self-end"
                  onClick={() => open(entry)}
                >
                  Revisar
                  <ArrowUpRight className="ml-1 size-3.5" />
                </Button>
              </article>
            ))}
          </div>
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
        <span>
          {loading
            ? "Consultando biblioteca…"
            : data?.total
              ? `${offset + 1}–${Math.min(offset + 20, data.total)} de ${data.total} conteúdos`
              : "Nenhum resultado"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={loading || offset === 0}
            onClick={() => setOffset((v) => Math.max(0, v - 20))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próxima página"
            disabled={loading || !data || offset + 20 >= data.total}
            onClick={() => setOffset((v) => v + 20)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Conhecimento do setor
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Base de conhecimento
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Organize o que a plataforma sabe sobre ferro e aço. Revise cada conteúdo antes de
            compartilhar com as distribuidoras.
          </p>
        </div>
        <Button onClick={() => setEditor({ id: null })}>
          <Plus className="mr-2 size-4" />
          Novo conteúdo
        </Button>
      </header>
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="h-auto max-w-full gap-1 bg-transparent p-0">
          <TabsTrigger value="library" className="gap-2 px-3 py-2.5">
            <BookOpen className="size-4" />
            Biblioteca
          </TabsTrigger>
          <TabsTrigger value="imports" className="gap-2 px-3 py-2.5">
            <Upload className="size-4" />
            Importações
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2 px-3 py-2.5">
            <ClipboardCheck className="size-4" />
            Revisão
          </TabsTrigger>
        </TabsList>
        <TabsContent value="library" className="mt-5">
          {content}
        </TabsContent>
        <TabsContent value="review" className="mt-5">
          <p className="mb-4 text-sm text-muted-foreground">
            Rascunhos e alterações que ainda precisam de aprovação.
          </p>
          {content}
        </TabsContent>
        <TabsContent value="imports" className="mt-5">
          <ImportPanel
            onChanged={() => setRevision((v) => v + 1)}
            onReview={(id) => setEditor({ id })}
          />
        </TabsContent>
      </Tabs>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Biblioteca comum da plataforma. Preços e estoque vêm do ERP de cada empresa. Políticas
        comerciais privadas não pertencem a esta base.
      </p>
      {editor && (
        <EntryEditor
          key={editor.id ?? "new"}
          id={editor.id}
          onClose={() => setEditor(null)}
          onChanged={() => setRevision((v) => v + 1)}
        />
      )}
    </div>
  );
}
