"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  FileJson,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  type Batch,
  parseImport,
  sendImport,
  getImports,
  getImport,
  errorMessage,
} from "@/lib/api/knowledge";
import { formatDate } from "@/lib/api/companies";
const sample = {
  messages: [
    { role: "customer", text: "O que significa metalon 30 por 30?" },
    {
      role: "agent",
      text: "É uma referência usual à seção de 30 por 30 milímetros. Confirme a espessura e o comprimento no catálogo do fabricante.",
    },
  ],
};
export function ImportPanel({
  onChanged,
  onReview,
}: {
  onChanged: () => void;
  onReview: (id: string) => void;
}) {
  const [file, setFile] = useState<{
    name: string;
    messages: ReturnType<typeof parseImport>;
  } | null>(null);
  const [reference, setReference] = useState("");
  const [terms, setTerms] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Batch | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<Batch | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const sequence = useRef(0);
  const retry = useRef<{ signature: string; id: string } | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setListError("");
    getImports(offset)
      .then((value) => {
        if (alive) setBatches(value);
      })
      .catch((e) => {
        if (alive) {
          setBatches([]);
          setListError(errorMessage(e));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [offset, revision]);
  useEffect(() => {
    if (!detailId) return;
    let alive = true;
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    getImport(detailId)
      .then((value) => {
        if (alive) setDetail(value);
      })
      .catch((e) => {
        if (alive) setDetailError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [detailId]);
  async function read(fileToRead: File | undefined) {
    if (busy || !fileToRead) return;
    const current = ++sequence.current;
    setError("");
    setResult(null);
    setFile(null);
    setAuthorized(false);
    setReading(true);
    try {
      if (!fileToRead.name.toLowerCase().endsWith(".json"))
        throw new Error("Selecione um arquivo .json. TXT, ZIP e PDF ainda não são suportados.");
      if (fileToRead.size > 524288) throw new Error("O arquivo deve ter até 512 KiB.");
      const messages = parseImport(await fileToRead.text());
      if (current === sequence.current) setFile({ name: fileToRead.name, messages });
    } catch (e) {
      if (current === sequence.current) setError(errorMessage(e));
    } finally {
      if (current === sequence.current) setReading(false);
    }
  }
  async function submit() {
    if (!file || !authorized || busy || reading) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const redaction_terms = terms
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
      if (
        redaction_terms.length > 100 ||
        redaction_terms.some((v) => v.length < 2 || v.length > 120)
      )
        throw new Error("Informe até 100 termos, um por linha, com 2 a 120 caracteres cada.");
      const data = {
        authorized: true,
        authorization_reference: reference.trim(),
        redaction_terms,
        messages: file.messages,
      };
      const signature = JSON.stringify(data);
      if (retry.current?.signature !== signature)
        retry.current = { signature, id: crypto.randomUUID() };
      const imported = await sendImport({ ...data, request_id: retry.current!.id });
      setResult(imported);
      setFile(null);
      setTerms("");
      setReference("");
      setAuthorized(false);
      setOffset(0);
      setRevision((v) => v + 1);
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-conversas.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Importar conversas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Transforme conversas autorizadas em rascunhos.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={download}>
            <ArrowDownToLine className="mr-2 size-3.5" />
            Baixar modelo
          </Button>
        </div>
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={busy} className="space-y-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void read(event.dataTransfer.files[0]);
              }}
              className={`relative rounded-2xl border border-dashed p-7 text-center transition-colors ${dragging ? "border-brand bg-accent/20" : "bg-muted/20"}`}
            >
              <span className="mx-auto grid size-11 place-items-center rounded-xl border bg-card">
                <FileJson className="size-5 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium">
                {reading
                  ? "Validando arquivo…"
                  : file
                    ? file.name
                    : "Arraste seu arquivo JSON aqui"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {file
                  ? `${file.messages.length} mensagens validadas`
                  : "Até 512 KiB · de 2 a 200 mensagens"}
              </p>
              <label className="mt-4 inline-flex cursor-pointer rounded-lg border bg-card px-4 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-ring">
                {file ? "Trocar arquivo" : "Selecionar arquivo"}
                <input
                  aria-label="Arquivo de conversas JSON"
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={(event) => {
                    void read(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span>Origem e referência da autorização</span>
              <Input
                required
                minLength={10}
                maxLength={500}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex.: Arquivo autorizado pelo responsável, registro…"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>
                Identificadores para remover{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </span>
              <textarea
                rows={3}
                maxLength={12100}
                className="w-full rounded-xl border bg-background p-3"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Um nome de pessoa, empresa ou identificador por linha"
              />
              <span className="block text-xs leading-relaxed text-muted-foreground">
                A remoção automática é assistida e pode deixar dados pessoais. Confira todos os
                rascunhos antes de publicar.
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-current"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
              />
              Confirmo que tenho autorização para usar estas conversas na biblioteca comum da
              plataforma.
            </label>
          </fieldset>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span className="text-xs text-muted-foreground">Nada é publicado automaticamente.</span>
            <Button
              type="submit"
              disabled={!file || !authorized || reference.trim().length < 10 || busy || reading}
            >
              <ArrowUpFromLine className="mr-2 size-4" />
              {busy ? "Importando…" : "Importar e gerar rascunhos"}
            </Button>
          </div>
        </form>
        {result && (
          <div role="status" className="mt-5 space-y-3 rounded-xl border bg-muted/20 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Check className="size-4 text-brand" />
              Importação concluída
            </p>
            <p className="text-sm text-muted-foreground">
              {result.candidate_ids.length} rascunho(s) gerado(s) · {result.redactions}{" "}
              ocorrência(s) removida(s).
            </p>
            {!result.candidate_ids.length && (
              <p className="text-sm">
                Nenhum par elegível de pergunta e resposta foi encontrado. Trechos com condições
                comerciais particulares são descartados.
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => setDetailId(result.id)}>
              Ver resultado da importação
            </Button>
          </div>
        )}
        <details className="mt-5 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Como preparar o arquivo?</summary>
          <p className="mt-3 leading-relaxed">
            Use o modelo JSON com uma lista messages. Cada mensagem contém role (customer para
            cliente ou agent para atendente) e text. O sistema usa pares consecutivos cliente →
            atendente; não usa IA nesta extração. TXT/ZIP do WhatsApp e PDF ainda não são aceitos.
          </p>
        </details>
      </section>
      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">Histórico de importações</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Arquivos recebidos e rascunhos gerados.
          </p>
        </div>
        {loading ? (
          <div role="status" aria-label="Carregando importações" className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : listError ? (
          <div role="alert" className="space-y-3 p-5 text-sm">
            <p>{listError}</p>
            <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : !batches.length ? (
          <p className="p-7 text-sm text-muted-foreground">Nenhuma importação nesta página.</p>
        ) : (
          <div className="divide-y">
            {batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => setDetailId(batch.id)}
                className="block w-full space-y-2 p-5 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{formatDate(batch.created_at)}</span>
                  <span className="text-xs text-muted-foreground">
                    {batch.candidate_ids.length} rascunho(s)
                  </span>
                </div>
                <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                  {batch.authorization_reference}
                </p>
                <p className="text-xs text-brand">Consultar resultado →</p>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
          <span>Página {offset / 20 + 1}</span>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="Importações anteriores"
              disabled={loading || offset === 0}
              onClick={() => setOffset((v) => Math.max(0, v - 20))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Próximas importações"
              disabled={loading || !!listError || batches.length < 20}
              onClick={() => setOffset((v) => v + 20)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
      <Dialog
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Resultado da importação</DialogTitle>
            <DialogDescription>
              Mensagens após remoção assistida de identificadores. Revisão humana obrigatória.
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p role="status" className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Carregando…
            </p>
          ) : detailError ? (
            <p role="alert" className="text-sm text-destructive">
              {detailError}
            </p>
          ) : (
            detail && (
              <div className="space-y-4">
                <p className="break-words text-sm">Origem: {detail.authorization_reference}</p>
                <p className="text-xs text-muted-foreground">
                  {detail.redactions} ocorrência(s) removida(s) · {detail.candidate_ids.length}{" "}
                  rascunho(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {detail.candidate_ids.map((id, index) => (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailId(null);
                        onReview(id);
                      }}
                    >
                      Revisar rascunho {index + 1}
                    </Button>
                  ))}
                </div>
                <div className="space-y-3">
                  {detail.sanitized_messages.map((message, index) => (
                    <div key={index} className="rounded-xl border bg-muted/20 p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {message.role === "customer" ? "Cliente" : "Atendente"}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
