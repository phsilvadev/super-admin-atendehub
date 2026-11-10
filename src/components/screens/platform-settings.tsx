"use client";
import { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getAI,
  saveAI,
  actionAI,
  getAdmins,
  saveAdmin,
  diagnosticLabels,
  type AIConfig,
  type Administrator,
} from "@/lib/api/platform-settings";
import { errorMessage } from "@/lib/api/knowledge";
import { formatDate } from "@/lib/api/companies";
export function PlatformSettingsScreen() {
  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Administração da plataforma
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie a conexão de IA e o acesso à administração.
        </p>
      </header>
      <Tabs defaultValue="openai">
        <TabsList className="h-auto bg-transparent p-0">
          <TabsTrigger className="gap-2 py-2.5" value="openai">
            <KeyRound className="size-4" />
            OpenAI
          </TabsTrigger>
          <TabsTrigger className="gap-2 py-2.5" value="administrators">
            <ShieldCheck className="size-4" />
            Administradores
          </TabsTrigger>
        </TabsList>
        <TabsContent value="openai" className="mt-5">
          <OpenAISettings />
        </TabsContent>
        <TabsContent value="administrators" className="mt-5">
          <Administrators />
        </TabsContent>
      </Tabs>
    </div>
  );
}
function OpenAISettings() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [model, setModel] = useState("");
  const [key, setKey] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [remove, setRemove] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getAI()
      .then((v) => {
        if (alive) {
          setConfig(v);
          setModel(v.model);
          setKey("");
          setPassword("");
        }
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
  }, [reload]);
  const dirty = !!config && (model !== config.model || !!key);
  async function act(action: "save" | "test" | "remove") {
    if (!config || busy) return;
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const value =
        action === "save"
          ? await saveAI({
              version: config.version,
              model,
              ...(key ? { api_key: key } : {}),
              current_password: password,
            })
          : await actionAI(action, { version: config.version, current_password: password });
      setConfig(value);
      setModel(value.model);
      setKey("");
      setPassword("");
      setRemove(false);
      setNotice(
        action === "save"
          ? "Configuração salva. Teste o acesso ao modelo."
          : action === "remove"
            ? "Chave removida do armazenamento da plataforma."
            : (diagnosticLabels[value.check_status ?? "unavailable"] ?? "Teste concluído."),
      );
    } catch (e) {
      setError(errorMessage(e));
      setPassword("");
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="size-5 text-muted-foreground" />
            Conexão OpenAI
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Credencial da plataforma, protegida no servidor.
          </p>
        </div>
        {config && (
          <Badge variant={config.configured ? "green" : "outline"}>
            {config.configured ? "Chave cadastrada" : "Não configurada"}
          </Badge>
        )}
      </div>
      {loading ? (
        <div role="status" aria-label="Carregando configuração OpenAI" className="space-y-4 p-6">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          {error && (
            <div role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm">
              <p>{error}</p>
              <Button
                className="mt-2"
                size="sm"
                variant="outline"
                disabled={!!busy}
                onClick={() => setReload((v) => v + 1)}
              >
                Recarregar configuração
              </Button>
            </div>
          )}
          {notice && (
            <p role="status" className="flex items-start gap-2 rounded-xl border p-3 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" />
              {notice}
            </p>
          )}
          {config && (
            <>
              {!config.can_manage && (
                <p className="rounded-xl bg-muted/40 p-4 text-sm">
                  Sua conta não possui permissão para alterar esta configuração.
                </p>
              )}
              {!config.storage_ready && (
                <p className="rounded-xl border p-4 text-sm">
                  O armazenamento seguro precisa ser ativado no backend antes de cadastrar a chave.
                </p>
              )}
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("save");
                }}
              >
                <fieldset className="space-y-4" disabled={!config.can_manage || !!busy}>
                  <label className="block space-y-1.5 text-sm">
                    <span>Chave da API OpenAI</span>
                    <Input
                      aria-label="Chave da API OpenAI"
                      type="password"
                      autoComplete="new-password"
                      spellCheck={false}
                      maxLength={512}
                      minLength={20}
                      value={key}
                      onChange={(e) => {
                        setKey(e.target.value);
                        setNotice("");
                      }}
                      placeholder={
                        config.configured
                          ? "Chave protegida · preencha apenas para substituir"
                          : "Cole sua chave da API OpenAI"
                      }
                    />
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      A chave não é devolvida pela API. Deixe vazio para manter a credencial
                      cadastrada.
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span>Modelo</span>
                    <Input
                      required
                      pattern="[a-zA-Z0-9][a-zA-Z0-9._:\-]*"
                      maxLength={120}
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        setNotice("");
                      }}
                      placeholder="Ex.: gpt-4.1-mini"
                    />
                    <span className="block text-xs text-muted-foreground">
                      Informe o identificador de um modelo disponível no seu projeto OpenAI.
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span>Sua senha atual</span>
                    <Input
                      aria-label="Sua senha atual"
                      type="password"
                      required
                      autoComplete="current-password"
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Confirme sua senha para continuar"
                    />
                  </label>
                </fieldset>
                <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      !config.can_manage ||
                      !config.configured ||
                      !password ||
                      !!busy ||
                      dirty ||
                      !config.storage_ready
                    }
                    onClick={() => void act("test")}
                  >
                    {busy === "test" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Testar conexão
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !config.can_manage ||
                      !password ||
                      !!busy ||
                      !dirty ||
                      !model ||
                      (!key && !config.configured) ||
                      !config.storage_ready
                    }
                  >
                    {busy === "save" ? "Salvando…" : "Salvar configuração"}
                  </Button>
                </div>
              </form>
              <div className="space-y-2 rounded-xl bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Último teste:</span>{" "}
                  {config.checked_at
                    ? `${formatDate(config.checked_at)} · ${diagnosticLabels[config.check_status ?? "unavailable"] ?? "Indisponível"}`
                    : "Nenhum teste realizado"}
                </p>
                <p>
                  O teste consulta o acesso ao modelo na API oficial. Não gera respostas, não envia
                  conversas e não valida saldo ou limites de geração.
                </p>
                <p>
                  Esta configuração prepara a integração. A IA comercial e o chat de suporte serão
                  conectados em etapas separadas.
                </p>
              </div>
              {config.can_manage && config.configured && (
                <div className="border-t pt-4">
                  {remove ? (
                    <div className="space-y-3 text-sm">
                      <p>
                        Remover a chave impede novas consultas pela plataforma. Para revogá-la na
                        OpenAI, use o painel do provedor.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={!!busy}
                          onClick={() => setRemove(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={!!busy || !password || dirty}
                          onClick={() => void act("remove")}
                        >
                          Confirmar remoção
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" disabled={!!busy} onClick={() => setRemove(true)}>
                      Remover chave
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
function Administrators() {
  const [rows, setRows] = useState<Administrator[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ admin: Administrator | null } | null>(null);
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
    getAdmins(search, offset)
      .then((value) => {
        if (alive) {
          setRows(value.items);
          setTotal(value.total);
        }
      })
      .catch((e) => {
        if (alive) {
          setRows([]);
          setTotal(0);
          setError(errorMessage(e));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [search, offset, revision]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Administradores da plataforma</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acessos exclusivos do superadmin, separados das empresas.
          </p>
        </div>
        <Button onClick={() => setEditor({ admin: null })}>
          <Plus className="mr-2 size-4" />
          Novo administrador
        </Button>
      </div>
      <p className="flex items-start gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" />O primeiro superadministrador só pode ser
        alterado pela própria conta e não pode ser desativado.
      </p>
      {notice && (
        <p role="status" className="rounded-xl border p-3 text-sm">
          {notice}
        </p>
      )}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex gap-3 border-b p-4">
          <Input
            aria-label="Buscar administrador"
            placeholder="Buscar por nome ou e-mail…"
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            size="icon"
            aria-label="Atualizar administradores"
            variant="outline"
            disabled={loading}
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
        {loading ? (
          <div role="status" aria-label="Carregando administradores" className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <Skeleton className="h-16" key={i} />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="space-y-3 p-5 text-sm">
            <p>{error}</p>
            <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : !rows.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum administrador encontrado.
          </p>
        ) : (
          <div className="divide-y">
            {rows.map((row) => (
              <article
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {row.name}
                    {row.is_self && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">Você</span>
                    )}
                  </p>
                  <p className="mt-1 break-all text-sm text-muted-foreground">{row.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={row.active ? "green" : "outline"}>
                      {row.active ? "Ativo" : "Desativado"}
                    </Badge>
                    {row.is_primary && (
                      <Badge variant="outline">
                        <LockKeyhole className="size-3" />
                        Primeiro administrador
                      </Badge>
                    )}
                  </div>
                </div>
                {row.can_edit ? (
                  <Button variant="outline" size="sm" onClick={() => setEditor({ admin: row })}>
                    Editar {row.name}
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LockKeyhole className="size-3.5" />
                    Conta protegida
                  </span>
                )}
              </article>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
          <span>{total} administrador(es)</span>
          <div className="flex gap-2">
            <Button
              aria-label="Administradores anteriores"
              variant="outline"
              size="icon"
              disabled={loading || offset === 0}
              onClick={() => setOffset((v) => Math.max(0, v - 20))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              aria-label="Próximos administradores"
              variant="outline"
              size="icon"
              disabled={loading || offset + 20 >= total}
              onClick={() => setOffset((v) => v + 20)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
      {editor && (
        <AdminEditor
          admin={editor.admin}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setNotice("Administrador salvo com sucesso.");
            setRevision((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
function AdminEditor({
  admin,
  onClose,
  onSaved,
}: {
  admin: Administrator | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(admin?.name ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [active, setActive] = useState(admin?.active ?? true);
  const [password, setPassword] = useState("");
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await saveAdmin(admin, {
        name,
        email,
        ...(admin ? { active, version: admin.version } : {}),
        ...(password ? { password } : {}),
        current_password: current,
      });
      setCurrent("");
      setPassword("");
      if (saved.requires_login) {
        window.location.replace("/login");
        return;
      }
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
      setCurrent("");
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
          <DialogTitle>{admin ? "Editar administrador" : "Novo administrador"}</DialogTitle>
          <DialogDescription>
            {admin?.is_primary
              ? "Esta é a conta primária protegida da plataforma."
              : "A conta terá acesso ao painel da plataforma e aos recursos de administração."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (admin?.active && !active) {
              setConfirm(true);
            } else void save();
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span>Nome</span>
              <Input
                minLength={2}
                maxLength={120}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>E-mail</span>
              <Input
                type="email"
                required
                maxLength={254}
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>{admin ? "Nova senha (opcional)" : "Senha do novo administrador"}</span>
              <Input
                aria-label={admin ? "Nova senha (opcional)" : "Senha do novo administrador"}
                type="password"
                required={!admin}
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="block text-xs text-muted-foreground">
                Mínimo de 12 caracteres.
                {admin ? " Alterar senha ou e-mail encerra as sessões dessa conta." : ""}
              </span>
            </label>
            {admin?.can_deactivate && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => {
                    setActive(e.target.checked);
                    setConfirm(false);
                  }}
                />
                Administrador ativo
              </label>
            )}
            <label className="block space-y-1.5 border-t pt-4 text-sm">
              <span>Sua senha atual</span>
              <Input
                aria-label="Sua senha atual"
                required
                type="password"
                autoComplete="current-password"
                maxLength={128}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
              <span className="block text-xs text-muted-foreground">
                Confirme a senha da sua conta para autorizar esta operação.
              </span>
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm">
              {error}
            </p>
          )}
          {confirm ? (
            <div className="space-y-3 rounded-xl border p-4 text-sm">
              <p>Desativar este administrador encerra suas sessões e impede novos acessos.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  Cancelar desativação
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy || !current}
                  onClick={() => void save()}
                >
                  Confirmar desativação
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy || !current || (!admin && !password)}>
                {busy ? "Salvando…" : "Salvar administrador"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
