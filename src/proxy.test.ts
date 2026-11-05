import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const readSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/server", () => ({ readSession }));
import { proxy } from "./proxy";
afterEach(() => vi.clearAllMocks());
it("backend indisponível devolve 503 sem liberar a página", async () => {
  readSession.mockResolvedValue({ status: "unavailable" });
  const response = await proxy(new NextRequest("http://localhost:3001/empresas"));
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("cabeçalho de bypass não autoriza acesso anônimo", async () => {
  readSession.mockResolvedValue({ status: "anonymous" });
  const response = await proxy(
    new NextRequest("http://localhost:3001/empresas", {
      headers: { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" },
    }),
  );
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toContain("/login");
});
it("login público não depende de sessão", async () => {
  const response = await proxy(new NextRequest("http://localhost:3001/login"));
  expect(response.status).toBe(200);
  expect(readSession).not.toHaveBeenCalled();
});
