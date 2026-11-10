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
  const [editing, setEditing] = useState(false);
  const [model, setModel] = useState("");
  const [key, setKey] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmation, setConfirmation] = useState<"test" | "remove" | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getAI()
      .then((value) => {
        if (alive) {
          setConfig(value);
          setModel(value.model);
          setKey("");
          setPassword("");
          setEditing(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setConfig(null);
          setError(errorMessage(e));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [reload]);
  const dirty = !!config && (model !== config.model || !!key);
  const validated = config?.configured && config.check_status === "verified";
  const failed = !!config?.configured && !!config.check_status && !validated;
  function ask(action: "test" | "remove") {
    setPassword("");
    setError("");
    setNotice("");
    setConfirmation(action);
  }
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
      setEditing(false);
      setConfirmation(null);
      setNotice(
        action === "save"
          ? "Chave salva com segurança. A configuração está cadastrada; agora você pode testar a conexão."
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
  function reloadConfig() {
    setConfirmation(null);
    setReload((v) => v + 1);
  }
  return (
    <section className="max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="size-5 text-muted-foreground" />
            Conexão OpenAI
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Credencial da plataforma, protegida no servidor.
          </p>
        </div>
        {!loading && config && (
          <Badge variant={validated ? "green" : failed ? "yellow" : "outline"}>
            {validated
              ? "Conexão validada"
              : failed
                ? "Verificar conexão"
                : config.configured
                  ? "Chave salva"
                  : "Não configurada"}
          </Badge>
        )}
      </header>
      {loading ? (
        <div role="status" aria-label="Carregando configuração OpenAI" className="space-y-4 p-6">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          {error && !confirmation && (
            <div role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={!!busy}
                onClick={reloadConfig}
              >
                Recarregar configuração
              </Button>
            </div>
          )}
          {notice && (
            <p
              role={failed ? "alert" : "status"}
              className="rounded-xl border bg-muted/20 p-3 text-sm"
            >
              {notice}
            </p>
          )}
          {config && (
            <>
              {!config.storage_ready && (
                <p className="rounded-xl border p-4 text-sm">
                  O armazenamento seguro precisa ser ativado no backend antes de cadastrar ou testar
                  a chave.
                </p>
              )}
              {config.configured && !editing ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-muted/30">
                      <ShieldCheck className="size-5 text-muted-foreground" />
                    </span>
                    <div>
                      <h3 className="font-semibold">Credencial cadastrada</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {validated
                          ? "O acesso ao modelo foi confirmado no último teste."
                          : failed
                            ? "Sua chave está salva, mas o último teste precisa de atenção."
                            : "Sua chave já está salva no servidor. Falta testar o acesso ao modelo."}
                      </p>
                    </div>
                  </div>
                  <dl className="grid gap-x-8 gap-y-5 rounded-xl border p-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Chave da API</dt>
                      <dd className="mt-2 flex items-center gap-2 text-sm">
                        <LockKeyhole className="size-3.5 text-muted-foreground" />
                        <span aria-label="Chave armazenada e protegida">••••••••</span>
                        <span className="text-xs text-muted-foreground">Protegida no servidor</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Modelo configurado</dt>
                      <dd className="mt-2 break-all text-sm font-medium">{config.model}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Status do acesso</dt>
                      <dd className="mt-2 text-sm">
                        {validated
                          ? "Validado no último teste"
                          : failed
                            ? (diagnosticLabels[config.check_status ?? "unavailable"] ??
                              "Falha no teste")
                            : "Aguardando teste de conexão"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Último teste</dt>
                      <dd className="mt-2 text-sm">
                        {config.checked_at
                          ? new Intl.DateTimeFormat("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                              timeZone: "America/Sao_Paulo",
                            }).format(new Date(config.checked_at * 1000))
                          : "Nenhum teste realizado"}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <Button
                      variant="outline"
                      disabled={!config.can_manage || !!busy}
                      onClick={() => ask("remove")}
                    >
                      Remover chave
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={!config.can_manage || !!busy}
                        onClick={() => {
                          setEditing(true);
                          setError("");
                          setNotice("");
                          setPassword("");
                        }}
                      >
                        Editar configuração
                      </Button>
                      <Button
                        disabled={!config.can_manage || !config.storage_ready || !!busy}
                        onClick={() => ask("test")}
                      >
                        Testar conexão
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act("save");
                  }}
                >
                  <div>
                    <h3 className="font-semibold">
                      {config.configured ? "Editar configuração" : "Cadastrar credencial"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {config.configured
                        ? "Altere o modelo ou substitua a chave. Salvar exige um novo teste de conexão."
                        : "Cadastre sua chave para preparar a conexão da plataforma."}
                    </p>
                  </div>
                  <fieldset className="space-y-4" disabled={!config.can_manage || !!busy}>
                    <label className="block space-y-1.5 text-sm">
                      <span>Chave da API OpenAI</span>
                      <Input
                        aria-label="Chave da API OpenAI"
                        type="password"
                        required={!config.configured}
                        autoComplete="new-password"
                        spellCheck={false}
                        minLength={20}
                        maxLength={512}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder={
                          config.configured
                            ? "Preencha apenas para substituir a chave"
                            : "Cole sua chave da API OpenAI"
                        }
                      />
                      <span className="block text-xs text-muted-foreground">
                        {config.configured
                          ? "Deixe vazio para manter a chave armazenada."
                          : "Após salvar, a chave não será exibida novamente."}
                      </span>
                    </label>
                    <label className="block space-y-1.5 text-sm">
                      <span>Modelo</span>
                      <Input
                        aria-label="Modelo"
                        required
                        maxLength={120}
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Ex.: gpt-4.1-mini"
                      />
                    </label>
                    <label className="block space-y-1.5 text-sm">
                      <span>Sua senha de superadministrador</span>
                      <Input
                        aria-label="Sua senha atual"
                        type="password"
                        required
                        autoComplete="current-password"
                        maxLength={128}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="A mesma senha usada para entrar neste painel"
                      />
                    </label>
                  </fieldset>
                  <div className="flex justify-end gap-2 border-t pt-4">
                    {config.configured && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => {
                          setEditing(false);
                          setModel(config.model);
                          setKey("");
                          setPassword("");
                          setError("");
                        }}
                      >
                        Cancelar edição
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={
                        !config.can_manage ||
                        !config.storage_ready ||
                        !!busy ||
                        !dirty ||
                        !password ||
                        !model ||
                        (!key && !config.configured)
                      }
                    >
                      {busy === "save" ? "Salvando…" : "Salvar configuração"}
                    </Button>
                  </div>
                </form>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                Salvar confirma o armazenamento da chave. Testar verifica o acesso ao modelo na API
                oficial, sem gerar respostas ou enviar conversas. O teste não valida saldo nem
                habilita automaticamente os atendimentos por IA.
              </p>
            </>
          )}
        </div>
      )}
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setConfirmation(null);
            setPassword("");
            setError("");
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-md overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {confirmation === "remove" ? "Remover chave OpenAI" : "Testar conexão OpenAI"}
            </DialogTitle>
            <DialogDescription>
              {confirmation === "remove"
                ? "Remove a chave armazenada na plataforma. Para revogá-la na OpenAI, use o painel do provedor."
                : "Consulta o acesso ao modelo configurado, sem gerar respostas. Confirme sua senha de superadministrador."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (confirmation) void act(confirmation);
            }}
          >
            <label className="block space-y-1.5 text-sm">
              <span>Sua senha de superadministrador</span>
              <Input
                aria-label="Sua senha atual"
                type="password"
                required
                autoComplete="current-password"
                maxLength={128}
                disabled={!!busy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="A mesma senha usada para entrar neste painel"
              />
            </label>
            {error && (
              <div role="alert" className="space-y-2 text-sm text-destructive">
                <p>{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!busy}
                  onClick={reloadConfig}
                >
                  Recarregar configuração
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!!busy}
                onClick={() => {
                  setConfirmation(null);
                  setPassword("");
                  setError("");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant={confirmation === "remove" ? "destructive" : "default"}
                disabled={!!busy || !password}
              >
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {confirmation === "remove" ? "Confirmar remoção" : "Confirmar teste"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
