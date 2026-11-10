import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3400";
const firstPassword = "Senha-plataforma-123!";
const otherPassword = "Senha-secundaria-e2e-123!";
test("configurações: chave write-only, gestão real e primeiro administrador protegido", async ({
  page,
  context,
  browser,
}) => {
  await page.goto("/configuracoes");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("E-mail", { exact: true }).fill("platform@example.com");
  await page.getByLabel("Senha", { exact: true }).fill(firstPassword);
  await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  await expect(page).toHaveURL(/\/empresas$/);
  await page.goto("/configuracoes");
  await expect(page.getByRole("heading", { name: "Conexão OpenAI", exact: true })).toBeVisible();
  const key = "sk-e2e-only-not-a-real-key-" + "x".repeat(25);
  await page.getByLabel("Chave da API OpenAI", { exact: true }).fill(key);
  await page.getByLabel("Sua senha atual", { exact: true }).fill(firstPassword);
  await page.getByRole("button", { name: "Salvar configuração", exact: true }).click();
  await expect(
    page.getByText(
      "Chave salva com segurança. A configuração está cadastrada; agora você pode testar a conexão.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Chave da API OpenAI", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Credencial cadastrada", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Credencial cadastrada", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Aguardando teste de conexão", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editar configuração", exact: true }).click();
  await page.getByLabel("Modelo", { exact: true }).fill("gpt-4.1");
  await page.getByRole("button", { name: "Cancelar edição", exact: true }).click();
  await expect(page.getByText("gpt-4.1-mini", { exact: true })).toBeVisible();
  const ai = await (await context.request.get("/api/platform/settings/openai")).json();
  expect(ai.configured).toBe(true);
  expect(JSON.stringify(ai)).not.toContain(key);
  await page.screenshot({ path: "/workspace/openai-chave-salva-resumo.png", fullPage: true });
  // Apenas o diagnóstico é simulado; cadastro/reload usam API e SQLite reais.
  await page.route("**/api/platform/settings/openai/test", (route) =>
    route.fulfill({
      json: { ...ai, checked_at: Math.floor(Date.now() / 1000), check_status: "verified" },
    }),
  );
  await page.getByRole("button", { name: "Testar conexão", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Testar conexão OpenAI", exact: true });
  await expect(
    confirmation.getByRole("button", { name: "Confirmar teste", exact: true }),
  ).toBeDisabled();
  await confirmation.getByLabel("Sua senha atual", { exact: true }).fill(firstPassword);
  await confirmation.getByRole("button", { name: "Confirmar teste", exact: true }).click();
  await expect(page.getByText("Conexão validada", { exact: true })).toBeVisible();
  await page.screenshot({ path: "/workspace/openai-conexao-validada-resumo.png", fullPage: true });
  await page.route("**/api/platform/settings/openai/test", (route) =>
    route.fulfill({
      json: { ...ai, checked_at: Math.floor(Date.now() / 1000), check_status: "invalid_key" },
    }),
  );
  await page.getByRole("button", { name: "Testar conexão", exact: true }).click();
  await confirmation.getByLabel("Sua senha atual", { exact: true }).fill(firstPassword);
  await confirmation.getByRole("button", { name: "Confirmar teste", exact: true }).click();
  await expect(page.getByText("Verificar conexão", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Chave não aceita pela OpenAI", { exact: true }).first(),
  ).toBeVisible();
  await page.unroute("**/api/platform/settings/openai/test");
  await page.getByRole("tab", { name: "Administradores", exact: true }).click();
  await page.getByRole("button", { name: "Novo administrador", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Ana Supervisora");
  await dialog.getByLabel("E-mail", { exact: true }).fill("admin-e2e@example.com");
  await dialog.getByLabel("Senha do novo administrador", { exact: true }).fill(otherPassword);
  await dialog.getByLabel("Sua senha atual", { exact: true }).fill(firstPassword);
  await page.screenshot({
    path: "/workspace/superadmin-cadastro-administrador.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Salvar administrador", exact: true }).click();
  await expect(page.getByText("Administrador salvo com sucesso.", { exact: true })).toBeVisible();
  const listed = await (await context.request.get("/api/platform/administrators")).json();
  const primary = listed.items.find((r: { is_primary: boolean }) => r.is_primary);
  const other = listed.items.find((r: { email: string }) => r.email === "admin-e2e@example.com");
  expect(primary.can_deactivate).toBe(false);
  expect(other.is_primary).toBe(false);
  const second = await browser.newContext({
    baseURL: origin,
    viewport: { width: 1440, height: 1000 },
  });
  expect(
    (
      await second.request.post("/api/platform/auth/login", {
        headers: { Origin: origin },
        data: { email: other.email, password: otherPassword },
      })
    ).status(),
  ).toBe(200);
  const secondary = await second.newPage();
  await secondary.goto("/configuracoes");
  await expect(
    secondary.getByRole("button", { name: "Editar configuração", exact: true }),
  ).toBeEnabled();
  await expect(
    secondary.getByRole("button", { name: "Testar conexão", exact: true }),
  ).toBeEnabled();
  await secondary.getByRole("tab", { name: "Administradores", exact: true }).click();
  await expect(secondary.getByText("Conta protegida", { exact: true })).toBeVisible();
  await expect(
    secondary.getByRole("button", { name: `Editar ${primary.name}`, exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await second.request.patch("/api/platform/administrators/" + primary.id, {
        headers: { Origin: origin },
        data: {
          name: primary.name,
          email: primary.email,
          active: false,
          version: primary.version,
          password: "Tentativa-nova-senha-123!",
          current_password: otherPassword,
        },
      })
    ).status(),
  ).toBe(403);
  await secondary.screenshot({
    path: "/workspace/superadmin-primeiro-admin-protegido.png",
    fullPage: true,
  });
  await secondary.setViewportSize({ width: 390, height: 844 });
  expect(await secondary.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
    true,
  );
  await secondary.screenshot({
    path: "/workspace/superadmin-administradores-mobile.png",
    fullPage: true,
  });
  await second.close();
  await page.getByRole("button", { name: "Editar Ana Supervisora", exact: true }).click();
  await dialog.getByLabel("Administrador ativo", { exact: true }).uncheck();
  await dialog.getByLabel("Sua senha atual", { exact: true }).fill(firstPassword);
  await dialog.getByRole("button", { name: "Salvar administrador", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirmar desativação", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(await secondRequestLogin(context)).toBe(401);
  expect(
    (
      await context.request.post("/api/platform/administrators", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.patch("/api/platform/settings/openai", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await page.getByRole("tab", { name: "OpenAI", exact: true }).click();
  await expect(page.getByText("Chave salva", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remover chave", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Remover chave OpenAI", exact: true })
    .getByLabel("Sua senha atual", { exact: true })
    .fill(firstPassword);
  await page.getByRole("button", { name: "Confirmar remoção", exact: true }).click();
  await expect(
    page.getByText("Chave removida do armazenamento da plataforma.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Chave da API OpenAI", { exact: true })).toBeVisible();
});
async function secondRequestLogin(context: import("@playwright/test").BrowserContext) {
  // Failed login leaves the current primary session untouched.
  return (
    await context.request.post("/api/platform/auth/login", {
      headers: { Origin: origin },
      data: { email: "admin-e2e@example.com", password: otherPassword },
    })
  ).status();
}
