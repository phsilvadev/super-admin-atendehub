import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { readSession } from "./server";
const token = "a".repeat(43);
const identity = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Gestor",
  role: "platform_admin",
};
afterEach(() => vi.unstubAllGlobals());
it("cookie ausente ou forjado não valida sessão", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect((await readSession()).status).toBe("anonymous");
  expect((await readSession("forged")).status).toBe("anonymous");
  expect(fetch).not.toHaveBeenCalled();
});
it("confere identidade de plataforma no backend sem cache", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(identity)));
  vi.stubGlobal("fetch", fetch);
  expect((await readSession(token)).status).toBe("authenticated");
  expect(fetch.mock.calls[0]?.[1]).toMatchObject({
    cache: "no-store",
    redirect: "error",
    headers: { Cookie: `atendehub_platform_session=${token}` },
  });
});
it("conta de empresa não é identidade de plataforma", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...identity, role: "admin" }))),
  );
  expect((await readSession(token)).status).toBe("unavailable");
});
it("backend indisponível falha fechado", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  expect((await readSession(token)).status).toBe("unavailable");
});
it("sessão revogada redireciona para acesso anônimo", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
  expect((await readSession(token)).status).toBe("anonymous");
});
