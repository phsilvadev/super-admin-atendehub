"use client";
import { useEffect, useState } from "react";
import { Check, FileText, History, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  type Entry,
  type Fields,
  type Revision,
  kinds,
  getEntry,
  getRevisions,
  saveEntry,
  publishEntry,
  deactivateEntry,
  errorMessage,
  fieldsSchema,
} from "@/lib/api/knowledge";
import { formatDate } from "@/lib/api/companies";
const blank: Fields = { title: "", body: "", kind: "faq", category: "", source_reference: "" };
const pick = (entry: Fields): Fields => ({
  title: entry.title,
  body: entry.body,
  kind: entry.kind,
  category: entry.category,
  source_reference: entry.source_reference,
});
export function EntryEditor({
  id,
  onClose,
  onChanged,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [fields, setFields] = useState<Fields>(blank);
  const [history, setHistory] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(id !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("content");
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState([false, false, false]);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [reload, setReload] = useState(0);
  const [discardReload, setDiscardReload] = useState(false);
  const entryId = id ?? entry?.id ?? null;
  const dirty = JSON.stringify(fields) !== JSON.stringify(entry ? pick(entry) : blank);
  useEffect(() => {
    if (!entryId) return;
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([getEntry(entryId), getRevisions(entryId)])
      .then(([value, revisions]) => {
        if (!alive) return;
        setEntry(value);
        setFields(pick(value));
        setHistory(revisions);
        setChecks([false, false, false]);
        setNote("");
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
  }, [entryId, reload]);
  function change<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setChecks([false, false, false]);
    setNote("");
    setSuccess("");
    setConfirmDeactivate(false);
  }
  async function act(action: "save" | "publish" | "deactivate") {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const value =
        action === "save"
          ? await saveEntry(fields, entry)
          : action === "publish" && entry
            ? await publishEntry(entry, note)
            : entry
              ? await deactivateEntry(entry)
              : null;
      if (!value) return;
      setEntry(value);
      setFields(pick(value));
      setChecks([false, false, false]);
      setNote("");
      setConfirmDeactivate(false);
      setSuccess(
        action === "save"
          ? "Rascunho salvo. Revise antes de publicar."
          : action === "publish"
            ? "Conteúdo publicado com sucesso."
            : "Conteúdo desativado. Ele não está mais disponível para as empresas.",
      );
      onChanged();
      try {
        setHistory(await getRevisions(value.id));
      } catch {
        setHistory([]);
      }
    } catch (e) {
      setError(errorMessage(e));
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
      <DialogContent
        className="max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-3xl gap-5 overflow-y-auto rounded-2xl p-5 sm:p-7"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="pr-6">
          <DialogTitle>{id || entry ? "Revisar conteúdo" : "Novo conteúdo"}</DialogTitle>
          <DialogDescription>
            Biblioteca comum de ferro e aço · publicação após revisão humana.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div role="status" className="flex items-center gap-2 py-12">
            <Loader2 className="size-4 animate-spin" />
            Carregando conteúdo…
          </div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"
              >
                <p>{error}</p>
                {entryId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={busy}
                    onClick={() => {
                      if (dirty) setDiscardReload(true);
                      else setReload((v) => v + 1);
                    }}
                  >
                    Recarregar versão atual
                  </Button>
                )}
              </div>
            )}
            {discardReload && (
              <div className="rounded-xl border p-3 text-sm">
                <p>Descartar alterações locais e carregar a versão atual?</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={() => setDiscardReload(false)}>
                    Manter alterações
                  </Button>
                  <Button
                    onClick={() => {
                      setDiscardReload(false);
                      setReload((v) => v + 1);
                    }}
                  >
                    Descartar e recarregar
                  </Button>
                </div>
              </div>
            )}
            {success && (
              <p role="status" className="flex items-start gap-2 rounded-xl border p-3 text-sm">
                <Check className="size-4 shrink-0 text-brand" />
                {success}
              </p>
            )}
            {(!id || entry) && (
              <Tabs
                value={tab}
                onValueChange={(value) => {
                  setTab(value);
                  setConfirmDeactivate(false);
                }}
              >
                <TabsList className="mb-4 w-full justify-start">
                  <TabsTrigger value="content">
                    <FileText className="mr-1.5 size-3.5" />
                    Conteúdo
                  </TabsTrigger>
                  <TabsTrigger value="review" disabled={!entry}>
                    Publicação
                  </TabsTrigger>
                  <TabsTrigger value="history" disabled={!entry}>
                    <History className="mr-1.5 size-3.5" />
                    Versões
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="space-y-4">
                  {entry?.active && entry.current_revision !== entry.published_revision && (
                    <p className="rounded-xl bg-muted p-3 text-sm">
                      A versão {entry.published_revision} continua publicada. Estas alterações só
                      ficam disponíveis após nova aprovação.
                    </p>
                  )}
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void act("save");
                    }}
                  >
                    <fieldset disabled={busy} className="space-y-4">
                      <label className="block space-y-1.5 text-sm">
                        <span>Título</span>
                        <Input
                          required
                          minLength={3}
                          maxLength={180}
                          value={fields.title}
                          onChange={(e) => change("title", e.target.value)}
                          placeholder="Ex.: Como identificar a espessura do metalon?"
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1.5 text-sm">
                          <span>Tipo de conteúdo</span>
                          <select
                            className="h-10 w-full rounded-xl border bg-background px-3"
                            value={fields.kind}
                            onChange={(e) => change("kind", e.target.value as Fields["kind"])}
                          >
                            {Object.entries(kinds).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block space-y-1.5 text-sm">
                          <span>Categoria</span>
                          <Input
                            required
                            minLength={2}
                            maxLength={80}
                            value={fields.category}
                            onChange={(e) => change("category", e.target.value)}
                            placeholder="Ex.: Tubos de aço"
                          />
                        </label>
                      </div>
                      <label className="block space-y-1.5 text-sm">
                        <span>Conteúdo</span>
                        <textarea
                          required
                          minLength={10}
                          maxLength={30000}
                          rows={8}
                          className="w-full resize-y rounded-xl border bg-background p-3 text-sm leading-relaxed"
                          value={fields.body}
                          onChange={(e) => change("body", e.target.value)}
                          placeholder="Registre a pergunta e a resposta, ou o texto técnico revisado."
                        />
                      </label>
                      <label className="block space-y-1.5 text-sm">
                        <span>Fonte / referência</span>
                        <Input
                          required
                          minLength={3}
                          maxLength={1000}
                          value={fields.source_reference}
                          onChange={(e) => change("source_reference", e.target.value)}
                          placeholder="Fabricante, catálogo, edição ou autorização de origem"
                        />
                      </label>
                    </fieldset>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <p className="text-xs text-muted-foreground">
                        {entry
                          ? `Versão atual ${entry.current_revision}`
                          : "O conteúdo será salvo como rascunho."}
                      </p>
                      <Button
                        disabled={
                          busy || !fieldsSchema.safeParse(fields).success || (!!entry && !dirty)
                        }
                        type="submit"
                      >
                        {busy ? "Salvando…" : "Salvar rascunho"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="review" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Publicar disponibiliza este conteúdo para todas as distribuidoras. Não inclua
                    preços, estoque ou políticas particulares de uma empresa.
                  </p>
                  {dirty && (
                    <p role="alert" className="rounded-xl border p-3 text-sm">
                      Salve as alterações na aba Conteúdo antes de publicar.
                    </p>
                  )}
                  <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
                    {entry?.body}
                  </div>
                  <fieldset disabled={busy || dirty} className="space-y-3">
                    {[
                      "Revisei os dados pessoais e removi informações identificáveis.",
                      "Confirmei a fonte e a autorização de uso deste conteúdo.",
                      "Confirmei que não há condições comerciais privadas de empresas.",
                    ].map((label, index) => (
                      <label key={label} className="flex items-start gap-2.5 text-sm">
                        <input
                          className="mt-1 size-4 shrink-0 accent-current"
                          type="checkbox"
                          checked={checks[index] ?? false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setChecks((previous) =>
                              previous.map((v, i) => (i === index ? checked : v)),
                            );
                          }}
                        />
                        {label}
                      </label>
                    ))}
                    <label className="block space-y-1.5 pt-2 text-sm">
                      <span>Nota da revisão</span>
                      <textarea
                        className="w-full rounded-xl border bg-background p-3"
                        rows={3}
                        minLength={10}
                        maxLength={1000}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Descreva o que foi conferido (mínimo 10 caracteres)."
                      />
                    </label>
                  </fieldset>
                  <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                    <Button
                      disabled={
                        busy ||
                        dirty ||
                        !checks.every(Boolean) ||
                        note.trim().length < 10 ||
                        (entry?.active && entry.current_revision === entry.published_revision)
                      }
                      onClick={() => void act("publish")}
                    >
                      {busy ? "Processando…" : "Publicar conteúdo"}
                    </Button>
                  </div>
                  {entry?.active && (
                    <div className="border-t pt-4">
                      {!confirmDeactivate ? (
                        <Button
                          variant="outline"
                          disabled={busy || dirty}
                          onClick={() => setConfirmDeactivate(true)}
                        >
                          Desativar conteúdo
                        </Button>
                      ) : (
                        <div className="space-y-3 rounded-xl border p-4">
                          <p className="text-sm">
                            Desativar retira este conteúdo da biblioteca disponível às empresas. O
                            histórico será preservado.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => setConfirmDeactivate(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={busy}
                              onClick={() => void act("deactivate")}
                            >
                              Confirmar desativação
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="history" className="space-y-3">
                  {history.length ? (
                    [...history].reverse().map((revision) => (
                      <details key={revision.revision} className="rounded-xl border p-4">
                        <summary className="cursor-pointer text-sm font-medium">
                          Versão {revision.revision} · {formatDate(revision.created_at)}
                          {entry?.active && entry.published_revision === revision.revision
                            ? " · Publicada"
                            : ""}
                        </summary>
                        <h3 className="mt-4 font-medium">{revision.title}</h3>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {revision.body}
                        </p>
                        <p className="mt-3 break-words text-xs text-muted-foreground">
                          Fonte: {revision.source_reference}
                        </p>
                      </details>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Histórico indisponível. Reabra o conteúdo para consultar.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
