import { afterEach, expect, it, vi } from "vitest";
import { getCompanies, companiesSchema, formatDate } from "./companies";
afterEach(() => vi.unstubAllGlobals());
it("consulta filtros na API e não inventa empresas", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        items: [],
        total: 0,
        summary: { total: 0, active: 0, trial: 0, trial_expired: 0, inactive: 0 },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  expect((await getCompanies("Aço", "trial", 20)).items).toEqual([]);
  expect(fetch.mock.calls[0]?.[0]).toContain("status=trial");
  expect(fetch.mock.calls[0]?.[0]).toContain("offset=20");
});
it("não aceita payload inválido como listagem", () => {
  expect(companiesSchema.safeParse({ items: [], total: 5 }).success).toBe(false);
});
it("formata datas no fuso de São Paulo", () => {
  expect(formatDate(Date.UTC(2026, 10, 5, 1) / 1000)).toContain("04");
  expect(formatDate(null)).toBe("—");
});
