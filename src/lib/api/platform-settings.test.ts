import { afterEach, expect, it, vi } from "vitest";
import { administratorSchema, getAI, saveAI, actionAI, saveAdmin } from "./platform-settings";
afterEach(() => vi.unstubAllGlobals());
const config = {
  model: "gpt-4.1-mini",
  version: 2,
  configured: true,
  storage_ready: true,
  checked_at: null,
  check_status: null,
  can_manage: true,
  diagnostic_only: true,
};
it("consulta somente configuração mascarada no backend", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(config)));
  vi.stubGlobal("fetch", fetch);
  expect((await getAI()).configured).toBe(true);
  expect(fetch.mock.calls[0]?.[0]).toBe("/api/platform/settings/openai");
});
it("salva pelo BFF com PATCH e não usa persistência de navegador", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(config)));
  vi.stubGlobal("fetch", fetch);
  const body = {
    version: 1,
    model: config.model,
    api_key: "sk-test-only-key-for-unit-test",
    current_password: "unit-password",
  };
  const result = await saveAI(body);
  expect(result).not.toHaveProperty("api_key");
  expect(fetch.mock.calls[0]?.[1].method).toBe("PATCH");
  expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual(body);
});
it("testa apenas o endpoint controlado sem acesso direto à OpenAI", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ ...config, check_status: "invalid_key" })));
  vi.stubGlobal("fetch", fetch);
  expect(
    (await actionAI("test", { version: 2, current_password: "unit-password" })).check_status,
  ).toBe("invalid_key");
  expect(fetch.mock.calls[0]?.[0]).toBe("/api/platform/settings/openai/test");
});
it("exige sinalizadores de proteção recebidos do backend", () => {
  expect(
    administratorSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Ana",
      email: "ana@example.com",
      active: true,
      version: 1,
    }).success,
  ).toBe(false);
});
