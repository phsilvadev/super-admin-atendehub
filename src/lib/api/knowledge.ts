import { z } from "zod";
import { api, ApiError } from "./client";
export const kinds = {
  faq: "Pergunta frequente",
  technical_document: "Documento técnico",
  synonym: "Sinônimo / termo",
  approved_answer: "Resposta orientativa",
} as const;
export const fieldsSchema = z.object({
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(10).max(30000),
  kind: z.enum(["faq", "technical_document", "synonym", "approved_answer"]),
  category: z.string().trim().min(2).max(80),
  source_reference: z.string().trim().min(3).max(1000),
});
export const revisionSchema = fieldsSchema.extend({
  revision: z.number().int(),
  created_at: z.number(),
});
export const entrySchema = revisionSchema.extend({
  id: z.string().uuid(),
  scope: z.literal("platform"),
  version: z.number().int(),
  current_revision: z.number().int(),
  published_revision: z.number().int().nullable(),
  active: z.boolean(),
  import_id: z.string().uuid().nullable(),
});
export const librarySchema = z.object({
  items: z.array(entrySchema),
  total: z.number().int(),
  categories: z.array(z.string()),
  summary: z.object({
    total: z.number().int(),
    review: z.number().int(),
    published: z.number().int(),
    inactive: z.number().int(),
  }),
});
export const batchSchema = z.object({
  id: z.string().uuid(),
  authorization_reference: z.string(),
  redactions: z.number(),
  candidate_ids: z.array(z.string().uuid()),
  requires_manual_review: z.literal(true),
  created_at: z.number(),
  sanitized_messages: z.array(z.object({ role: z.enum(["customer", "agent"]), text: z.string() })),
});
const messagesSchema = z
  .array(
    z
      .object({ role: z.enum(["customer", "agent"]), text: z.string().trim().min(1).max(3000) })
      .strict(),
  )
  .min(2)
  .max(200);
export type Fields = z.infer<typeof fieldsSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Revision = z.infer<typeof revisionSchema>;
export type Library = z.infer<typeof librarySchema>;
export type Batch = z.infer<typeof batchSchema>;
export function statusOf(entry: Entry) {
  if (!entry.active && entry.published_revision !== null) return "inactive";
  if (entry.published_revision === null) return "draft";
  return entry.current_revision !== entry.published_revision ? "pending" : "published";
}
export const statusLabels = {
  inactive: "Desativado",
  draft: "Rascunho",
  pending: "Alterações pendentes",
  published: "Publicado",
};
export function parseImport(text: string) {
  if (new TextEncoder().encode(text).length > 524288)
    throw new Error("O arquivo deve ter até 512 KiB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSON inválido. Confira o modelo de arquivo.");
  }
  const messages =
    parsed && typeof parsed === "object" && "messages" in parsed ? parsed.messages : parsed;
  const result = messagesSchema.safeParse(messages);
  if (!result.success)
    throw new Error(
      "Use de 2 a 200 mensagens com role customer ou agent e text de até 3.000 caracteres.",
    );
  return result.data;
}
export function errorMessage(error: unknown) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    window.location.replace("/login");
    return "A sessão não permite esta operação. Entre novamente.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
export async function getLibrary(params: Record<string, string>) {
  return librarySchema.parse(await api(`knowledge?${new URLSearchParams(params)}`));
}
export async function getEntry(id: string) {
  return entrySchema.parse(await api(`knowledge/${id}`));
}
export async function getRevisions(id: string) {
  return z.object({ items: z.array(revisionSchema) }).parse(await api(`knowledge/${id}/revisions`))
    .items;
}
export async function saveEntry(fields: Fields, entry: Entry | null) {
  const value = fieldsSchema.parse(fields);
  return entrySchema.parse(
    await api(
      entry ? `knowledge/${entry.id}` : "knowledge",
      entry ? { ...value, version: entry.version } : value,
      entry ? "PATCH" : "POST",
    ),
  );
}
export async function publishEntry(entry: Entry, note: string) {
  return entrySchema.parse(
    await api(`knowledge/${entry.id}/publish`, {
      version: entry.version,
      privacy_checked: true,
      source_rights_confirmed: true,
      commercial_isolation_checked: true,
      review_note: note.trim(),
    }),
  );
}
export async function deactivateEntry(entry: Entry) {
  return entrySchema.parse(
    await api(`knowledge/${entry.id}/deactivate`, { version: entry.version }),
  );
}
export async function getImports(offset: number) {
  return z
    .object({ items: z.array(batchSchema) })
    .parse(await api(`knowledge/imports?offset=${offset}&limit=20`)).items;
}
export async function getImport(id: string) {
  return batchSchema.parse(await api(`knowledge/imports/${id}`));
}
export async function sendImport(payload: unknown) {
  if (new TextEncoder().encode(JSON.stringify(payload)).length > 524288)
    throw new Error("A solicitação completa deve ter até 512 KiB. Divida o arquivo.");
  return batchSchema.parse(await api("knowledge/imports", payload));
}
