import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3400";
const base = "/api/platform/knowledge";
test("biblioteca real: importar, revisar, publicar, editar com conflito e desativar", async ({
  page,
  context,
  browser,
}) => {
  await page.goto("/base-conhecimento");
  await expect(page.getByRole("region", { name: "Resumo da biblioteca" })).toHaveCount(0);
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Importações", exact: true }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get(base)).status()).toBe(401);
  await page.getByLabel("E-mail", { exact: true }).fill("platform@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Senha-plataforma-123!");
  await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  await expect(page).toHaveURL(/\/empresas$/);
  await page.goto("/base-conhecimento");
  await expect(
    page.getByRole("heading", { name: "Sua biblioteca começa aqui", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Novo conteúdo", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título", { exact: true }).fill("Termos para tubos de aço");
  await dialog.getByLabel("Categoria", { exact: true }).fill("Tubos de aço");
  await dialog
    .getByRole("textbox", { name: "Conteúdo", exact: true })
    .fill("Confirme seção, espessura, comprimento e quantidade antes de consultar o catálogo.");
  await dialog
    .getByLabel("Fonte / referência", { exact: true })
    .fill("Orientação técnica revisada para o teste");
  await dialog.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(
    dialog.getByText("Rascunho salvo. Revise antes de publicar.", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Termos para tubos de aço", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Importações", exact: true }).click();
  await page.screenshot({ path: "/workspace/importacao-reorganizada-desktop.png", fullPage: true });
  const upload = page.getByLabel("Arquivo de conversas JSON", { exact: true });
  await upload.setInputFiles({
    name: "erro.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await expect(page.getByRole("alert").filter({ hasText: "JSON inválido" })).toBeVisible();
  await upload.setInputFiles({
    name: "conversas.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        messages: [
          {
            role: "customer",
            text: "Sou Pessoa Exemplo, contato pessoa@example.com. O que é metalon 30 por 30?",
          },
          {
            role: "agent",
            text: "É uma referência à seção de 30 por 30 milímetros. Confirme espessura e comprimento no catálogo do fabricante.",
          },
          { role: "customer", text: "Consegue desconto especial?" },
          { role: "agent", text: "Preço R$ 100,00 com frete grátis." },
        ],
      }),
    ),
  });
  await expect(page.getByText("4 mensagens validadas", { exact: true })).toBeVisible();
  await page
    .getByLabel("Origem e referência da autorização", { exact: true })
    .fill("Arquivo autorizado exclusivamente para validação automatizada");
  await page.getByLabel("Identificadores para remover", { exact: false }).fill("Pessoa Exemplo");
  await expect(
    page.getByRole("button", { name: "Importar e gerar rascunhos", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /Confirmo que tenho autorização/ }).check();
  await page.screenshot({
    path: "/workspace/superadmin-conhecimento-importacao.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Importar e gerar rascunhos", exact: true }).click();
  await expect(page.getByText("Importação concluída", { exact: true })).toBeVisible();
  const historyTrigger = page.getByRole("button", {
    name: "Histórico de importações",
    exact: true,
  });
  await historyTrigger.click();
  const historyPanel = page.getByRole("dialog", { name: "Histórico de importações", exact: true });
  await expect(
    historyPanel.getByRole("button").filter({ hasText: "Arquivo autorizado exclusivamente" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const bounds = await historyPanel.boundingBox();
      return Math.round((bounds?.x ?? 0) + (bounds?.width ?? 0));
    })
    .toBe(1440);
  await page.screenshot({
    path: "/workspace/importacao-historico-aside-desktop.png",
    animations: "disabled",
  });
  await historyPanel
    .getByRole("button")
    .filter({ hasText: "Arquivo autorizado exclusivamente" })
    .click();
  await expect(dialog.getByText("pessoa@example.com", { exact: false })).toHaveCount(0);
  await expect(dialog.getByText("Pessoa Exemplo", { exact: false })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Revisar rascunho 1", exact: true }).click();
  await expect(dialog.getByLabel("Título", { exact: true })).toHaveValue(/DADO REMOVIDO/);
  await dialog.getByLabel("Título", { exact: true }).fill("Como entender metalon 30 por 30?");
  await dialog.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(
    dialog.getByText("Rascunho salvo. Revise antes de publicar.", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("tab", { name: "Publicação", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Publicar conteúdo", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("checkbox").nth(0).check();
  await dialog.getByRole("checkbox").nth(1).check();
  await dialog.getByRole("checkbox").nth(2).check();
  await dialog
    .getByLabel("Nota da revisão", { exact: true })
    .fill("Conferidos os termos e removidos dados pessoais; uso autorizado para biblioteca comum.");
  await page.screenshot({ path: "/workspace/superadmin-conhecimento-revisao.png", fullPage: true });
  await dialog.getByRole("button", { name: "Publicar conteúdo", exact: true }).click();
  await expect(dialog.getByText("Conteúdo publicado com sucesso.", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  const library = await (await context.request.get(base)).json();
  const entry = library.items.find(
    (v: { title: string }) => v.title === "Como entender metalon 30 por 30?",
  );
  expect(entry.active).toBe(true);
  await page.getByRole("tab", { name: "Biblioteca", exact: true }).click();
  await page.getByLabel("Filtrar status", { exact: true }).selectOption("published");
  await expect(page.getByRole("button", { name: entry.title, exact: true })).toBeVisible();
  await page.getByRole("button", { name: entry.title, exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "Conteúdo", exact: true })
    .fill("Nova orientação: confirme as medidas e a quantidade no catálogo técnico aprovado.");
  const stale = await context.request.patch(base + "/" + entry.id, {
    headers: { Origin: origin },
    data: {
      title: entry.title,
      body: "Alteração paralela para validar proteção contra sobrescrita.",
      kind: entry.kind,
      category: entry.category,
      source_reference: entry.source_reference,
      version: entry.version,
    },
  });
  expect(stale.status()).toBe(200);
  await dialog.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("outra pessoa");
  await dialog.getByRole("button", { name: "Recarregar versão atual", exact: true }).click();
  await dialog.getByRole("button", { name: "Descartar e recarregar", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Conteúdo", exact: true })).toHaveValue(
    "Alteração paralela para validar proteção contra sobrescrita.",
  );
  await dialog.getByRole("tab", { name: "Versões", exact: true }).click();
  await expect(dialog.locator("summary").filter({ hasText: "Versão 3" })).toBeVisible();
  await dialog.getByRole("tab", { name: "Publicação", exact: true }).click();
  await dialog.getByRole("button", { name: "Desativar conteúdo", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirmar desativação", exact: true }).click();
  await expect(dialog.getByText(/Conteúdo desativado\./)).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByLabel("Filtrar status", { exact: true }).selectOption("all");
  await expect(page.getByRole("button", { name: entry.title, exact: true })).toBeVisible();
  await page.screenshot({
    path: "/workspace/superadmin-conhecimento-biblioteca.png",
    fullPage: true,
  });
  await page.route("**/api/platform/knowledge?**", (route) =>
    route.fulfill({ status: 503, json: { detail: "Biblioteca indisponível para teste." } }),
  );
  await page.getByRole("button", { name: "Atualizar biblioteca", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Biblioteca indisponível" }),
  ).toBeVisible();
  await page.unroute("**/api/platform/knowledge?**");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByRole("button", { name: entry.title, exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/workspace/superadmin-conhecimento-mobile.png", fullPage: true });
  await page.getByRole("tab", { name: "Importações", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Novo conteúdo", exact: true }).click();
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.height).toBeLessThanOrEqual(844);
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.screenshot({ path: "/workspace/importacao-reorganizada-mobile.png", fullPage: true });
  await historyTrigger.click();
  await expect(
    historyPanel.getByRole("button").filter({ hasText: "Arquivo autorizado exclusivamente" }),
  ).toBeVisible();
  await expect
    .poll(async () => Math.round((await historyPanel.boundingBox())?.width ?? 0))
    .toBe(390);
  await page.screenshot({
    path: "/workspace/importacao-historico-aside-mobile.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(historyPanel).not.toBeVisible();
  await expect(historyTrigger).toBeFocused();
  await page.goto("/importacoes");
  await expect(page).toHaveURL(/\/base-conhecimento\?tab=imports$/);
  await expect(
    page.getByRole("heading", { name: "Importar conversas", exact: true }),
  ).toBeVisible();
  expect(
    (
      await context.request.post(base, { headers: { Origin: "https://evil.example" }, data: {} })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post(base + "/imports", {
        headers: { Origin: origin, "Content-Type": "application/json" },
        data: "x".repeat(524289),
      })
    ).status(),
  ).toBe(413);
  expect(
    (await context.request.delete(base + "/" + entry.id, { headers: { Origin: origin } })).status(),
  ).toBe(405);
  expect((await context.request.get(base + "/not-a-uuid")).status()).toBe(404);
  const tenant = await browser.newContext();
  expect(
    (
      await tenant.request.post("http://127.0.0.1:8400/api/v1/auth/register", {
        headers: { Origin: origin },
        data: {
          name: "Tenant",
          company: "Empresa privada",
          email: "knowledge-tenant@example.com",
          password: "Senha-segura-123",
        },
      })
    ).status(),
  ).toBe(201);
  const tenantCookies = await tenant.cookies();
  await tenant.addCookies(tenantCookies.map((cookie) => ({ ...cookie, path: "/" })));
  expect((await tenant.request.get(origin + base)).status()).toBe(401);
  await tenant.close();
});
