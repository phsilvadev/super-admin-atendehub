import { afterEach, expect, it, vi } from "vitest";
import { usd, getUsage, usageSchema, addPrice } from "./ai-usage";
afterEach(() => vi.unstubAllGlobals());
it("não formata custo desconhecido como zero e preserva custos pequenos", () => {
  expect(usd(null)).toBe("Não calculado");
  expect(usd("0.0000004")).toContain("0000004");
  expect(usd("0.00000000000001")).toContain("<");
});
it("omite UUIDs vazios e envia filtros ao servidor", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetch);
  await expect(
    getUsage({ start: "2026-11-10", company_id: "", user_id: "", offset: "20" }),
  ).rejects.toThrow();
  const url = fetch.mock.calls[0]?.[0];
  expect(url).toContain("offset=20");
  expect(url).not.toContain("company_id");
});
it("rejeita números financeiros em float no contrato", () => {
  expect(usageSchema.safeParse({ summary: { estimated_cost_usd: 0.4 } }).success).toBe(false);
});
