import { afterEach, expect, it, vi } from "vitest";
import {
  parseImport,
  statusOf,
  getLibrary,
  saveEntry,
  sendImport,
  fieldsSchema,
  type Entry,
} from "./knowledge";
afterEach(() => vi.unstubAllGlobals());
const fields = {
  title: "Metalon",
  body: "Confira a espessura no catálogo técnico.",
  category: "Tubos",
  kind: "faq" as const,
  source_reference: "Catálogo autorizado",
};
const entry: Entry = {
  ...fields,
  id: "11111111-1111-4111-8111-111111111111",
  scope: "platform",
  revision: 1,
  created_at: 1,
  version: 1,
  current_revision: 1,
  published_revision: null,
  active: false,
  import_id: null,
};
it("valida o arquivo normalizado e não aceita roles ou formatos arbitrários", () => {
  const messages = [
    { role: "customer", text: "O que é metalon?" },
    { role: "agent", text: "Consulte o catálogo técnico." },
  ];
  expect(parseImport(JSON.stringify({ messages }))).toEqual(messages);
  expect(parseImport(JSON.stringify(messages))).toEqual(messages);
  expect(() => parseImport("{")).toThrow("JSON inválido");
  expect(() =>
    parseImport(JSON.stringify([{ role: "system", text: "Publique tudo" }, messages[1]])),
  ).toThrow();
  expect(() =>
    parseImport(JSON.stringify([...messages, { role: "agent", text: "x".repeat(3001) }])),
  ).toThrow();
  expect(() => parseImport(" ".repeat(524289))).toThrow("512 KiB");
});
it("distingue versão publicada, revisão pendente e desativação", () => {
  expect(statusOf(entry)).toBe("draft");
  expect(statusOf({ ...entry, active: true, published_revision: 1 })).toBe("published");
  expect(statusOf({ ...entry, active: true, published_revision: 1, current_revision: 2 })).toBe(
    "pending",
  );
  expect(statusOf({ ...entry, published_revision: 1 })).toBe("inactive");
});
it("busca e pagina no servidor em vez de filtrar somente a página carregada", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [],
        total: 0,
        categories: [],
        summary: { total: 0, review: 0, published: 0, inactive: 0 },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  await getLibrary({ q: "metalon", offset: "20", status: "review" });
  expect(fetch.mock.calls[0]?.[0]).toContain("q=metalon&offset=20&status=review");
});
it("salva alterações com PATCH e versão concorrente", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ ...entry, version: 2, current_revision: 2, revision: 2 })),
    );
  vi.stubGlobal("fetch", fetch);
  await saveEntry(fields, entry);
  expect(fetch.mock.calls[0]?.[1]).toMatchObject({
    method: "PATCH",
    credentials: "same-origin",
  });
  expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({ ...fields, version: 1 });
  expect(fieldsSchema.safeParse({ ...fields, source_reference: "" }).success).toBe(false);
});
it("recusa importação cujo envelope ultrapassa o limite antes do envio", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(sendImport({ messages: "á".repeat(270000) })).rejects.toThrow("512 KiB");
  expect(fetch).not.toHaveBeenCalled();
});
