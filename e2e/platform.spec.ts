import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const origin = "http://127.0.0.1:3400";
const backend = "http://127.0.0.1:8400";
const cookieName = "atendehub_platform_session";
function sql(statement: string, value: string) {
  const meta = JSON.parse(readFileSync(".e2e-backend.json", "utf8"));
  execFileSync(meta.python, [
    "-c",
    "import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute(sys.argv[2],(sys.argv[3],)); db.commit(); db.close()",
    meta.database,
    statement,
    value,
  ]);
}
test("superadmin autentica com API real e consulta empresas sem acesso de tenant", async ({
  page,
  context,
  browser,
}) => {
  const stamp = Date.now();
  const tenant = await context.request.post(backend + "/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Pedro Almeida",
      company: "Aço Moreira",
      email: "pedro@moreira.example.com",
      password: "Senha-segura-123",
    },
  });
  expect(tenant.status()).toBe(201);
  const identity = await tenant.json();
  const tenantCookie = (await context.cookies()).find((c) => c.name === "atendehub_session")!;
  await context.request.patch(backend + "/api/v1/company/settings", {
    headers: { Origin: origin },
    data: {
      name: "Aço Moreira",
      legal_name: "Moreira Comércio de Ferro e Aço Ltda.",
      tax_id: "11.222.333/0001-81",
      email: "comercial@example.com",
      phone: "1133334444",
    },
  });
  for (const [name, kind] of [
    ["Vale Distribuidora", "active"],
    ["JR Ferro e Aço", "inactive"],
    ["Metal Sul", "trial_expired"],
  ]) {
    const reg = await context.request.post(backend + "/api/v1/auth/register", {
      headers: { Origin: origin },
      data: {
        name: "Ana Souza",
        company: name,
        email: `gestao@${kind.replaceAll("_", "-")}.example.com`,
        password: "Senha-segura-123",
      },
    });
    expect(reg.status()).toBe(201);
    const result = await reg.json();
    if (kind === "inactive") sql("UPDATE companies SET active=0 WHERE id=?", result.company.id);
    if (kind === "active")
      sql("UPDATE companies SET plan='professional' WHERE id=?", result.company.id);
    if (kind === "trial_expired")
      sql(
        "UPDATE companies SET trial_started_at=trial_started_at-691200,trial_ends_at=trial_ends_at-691200 WHERE id=?",
        result.company.id,
      );
  }
  await context.clearCookies();
  await page.goto("/empresas");
  await expect(page).toHaveURL(/\/login$/);
  const forged = await context.request.get("/empresas", {
    maxRedirects: 0,
    headers: {
      Cookie: `${cookieName}=${tenantCookie.value}`,
      "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy",
    },
  });
  expect([303, 307, 308]).toContain(forged.status());
  expect(
    (
      await context.request.get("/api/platform/companies", {
        headers: { Cookie: `${cookieName}=${tenantCookie.value}` },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await context.request.post("/api/platform/auth/login", {
        headers: { Origin: origin },
        data: { email: "pedro@moreira.example.com", password: "Senha-segura-123" },
      })
    ).status(),
  ).toBe(401);
  await page.getByRole("heading", { name: "Bem-vindo de volta", exact: true }).waitFor();
  await page.screenshot({
    path: test.info().outputPath("superadmin-login-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("E-mail", { exact: true }).fill("platform@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Senha-plataforma-123!");
  await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  await expect(page).toHaveURL(/\/empresas$/);
  await expect(page.getByRole("cell", { name: "Aço Moreira", exact: false })).toBeVisible();
  const platformCookie = (await context.cookies()).find((c) => c.name === cookieName)!;
  expect(platformCookie.httpOnly).toBe(true);
  expect(platformCookie.path).toBe("/");
  expect(await page.evaluate(() => document.cookie)).not.toContain(cookieName);
  await expect(page.getByRole("button", { name: /Nova empresa|Editar empresa/ })).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath("superadmin-companies-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("Filtrar status", { exact: true }).selectOption("trial_expired");
  await expect(page.getByText("Metal Sul", { exact: true })).toBeVisible();
  await expect(page.getByText("Aço Moreira", { exact: true })).toHaveCount(0);
  await page.getByLabel("Filtrar status", { exact: true }).selectOption("all");
  await page
    .getByRole("textbox", { name: "Buscar empresa", exact: true })
    .fill("11.222.333/0001-81");
  await expect(page.getByText("Aço Moreira", { exact: true })).toBeVisible();
  await expect(page.getByText("Vale Distribuidora", { exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Buscar empresa", exact: true }).fill("inexistente");
  await expect(
    page.getByRole("heading", { name: "Nenhuma empresa encontrada", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Buscar empresa", exact: true }).fill("");
  await expect(page.getByText("Vale Distribuidora", { exact: true })).toBeVisible();
  await page.route("**/api/platform/companies?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Serviço indisponível para validação de falha." }),
    }),
  );
  await page.getByRole("button", { name: "Atualizar empresas", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Serviço indisponível" })).toBeVisible();
  await expect(page.getByText("Aço Moreira", { exact: true })).toHaveCount(0);
  await page.unroute("**/api/platform/companies?**");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByText("Aço Moreira", { exact: true })).toBeVisible();
  expect(
    (
      await context.request.post("/api/platform/auth/logout", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post("/api/platform/companies", {
        headers: { Origin: origin },
        data: {},
      })
    ).status(),
  ).toBe(404);
  expect((await context.request.get("/api/platform/knowledge")).status()).toBe(404);
  const replay = platformCookie.value;
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({
    path: test.info().outputPath("superadmin-companies-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await context.addCookies([{ name: cookieName, value: replay, url: origin }]);
  expect((await context.request.get("/api/platform/auth/me")).status()).toBe(401);
  await page.goto("/empresas");
  await expect(page).toHaveURL(/\/login$/);
  await context.clearCookies();
  await page.getByLabel("E-mail", { exact: true }).fill("platform@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Senha-plataforma-123!");
  await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  await expect(page).toHaveURL(/\/empresas$/);
  sql(
    "UPDATE platform_sessions SET expires_at=1 WHERE admin_id IN (SELECT id FROM platform_admins WHERE email=?)",
    "platform@example.com",
  );
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: test.info().outputPath("superadmin-login-mobile.png"),
    fullPage: true,
  });
  const separate = await browser.newContext({ baseURL: origin });
  await separate.addCookies([
    { name: "atendehub_session", value: tenantCookie.value, url: origin },
  ]);
  expect((await separate.request.get("/api/platform/companies")).status()).toBe(401);
  await separate.close();
});
