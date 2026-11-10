import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const origin = "http://127.0.0.1:3400";
test.use({ locale: "pt-BR" });
test("consumo real: precisão, filtros, tarifas, pendências e acesso protegido", async ({
  page,
  context,
  browser,
}) => {
  await page.goto("/consumo-ia");
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get("/api/platform/ai-usage")).status()).toBe(401);
  const stamp = Date.now();
  const identities = [];
  for (const name of ["Aço Moreira", "Metal Vale"]) {
    const reg = await context.request.post("http://127.0.0.1:8400/api/v1/auth/register", {
      headers: { Origin: origin },
      data: {
        name: "Pedro Almeida",
        company: name,
        email: `usage-${identities.length}-${stamp}@example.com`,
        password: "Senha-segura-123",
      },
    });
    expect(reg.status()).toBe(201);
    identities.push(await reg.json());
  }
  const meta = JSON.parse(readFileSync(".e2e-backend.json", "utf8"));
  execFileSync(
    meta.python,
    [
      "-c",
      `
import os,json,sys
from pathlib import Path
p=Path(sys.argv[1]);assert p.name=='test.db' and p.parent.name.startswith('atendehub-tenant-tests-')
os.environ['DATABASE_URL']='sqlite:///'+str(p)
os.environ['TURNSTILE_ENABLED']='false'
from app.core.database import SessionLocal
from app.models.ai_usage import AIUsage
from app.core.security import now
from app.services.ai_accounting import price_usage
from uuid import uuid4
identities=json.loads(sys.argv[2])
with SessionLocal() as db:
 for i,item in enumerate(identities):
  row=AIUsage(id=str(uuid4()),company_id=item['company']['id'],user_id=item['user']['id'],model='gpt-4.1-mini' if i==0 else 'custom-ui-model',feature='support',status='complete',input_tokens=1000000 if i==0 else 50,cached_tokens=250000 if i==0 else 0,output_tokens=1000000 if i==0 else 20,service_tier='default',created_at=now(),finished_at=now(),pricing_status='unknown_price')
  db.add(row);price_usage(db,row)
 first=identities[0]
 db.add(AIUsage(id=str(uuid4()),company_id=first['company']['id'],user_id=first['user']['id'],model='gpt-4.1-mini',feature='support',status='failed',created_at=now(),finished_at=now(),pricing_status='unknown_usage'))
 db.commit()
`,
      meta.database,
      JSON.stringify(identities),
    ],
    { cwd: process.env["BACKEND_SOURCE_DIR"] ?? "/workspace/atend-hub-backend-ZHNER7" },
  );
  await page.getByLabel("E-mail", { exact: true }).fill("platform@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Senha-plataforma-123!");
  await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  await expect(page).toHaveURL(/\/empresas$/);
  await page.goto("/consumo-ia");
  await expect(
    page.getByText(
      "Há chamadas sem medição, sem tarifa ou com modalidade não suportada. Elas não foram tratadas como custo zero.",
      { exact: true },
    ),
  ).toBeVisible();
  const response = await context.request.get("/api/platform/ai-usage");
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.total).toBe(3);
  expect(Number(result.summary.estimated_cost_usd)).toBe(1.925);
  expect(result.summary.unpriced_requests).toBe(2);
  await expect(page.getByRole("region", { name: "Indicadores de consumo" })).toContainText("1,925");
  await page.screenshot({ path: "/workspace/superadmin-consumo-ia-desktop.png", fullPage: true });
  await page.getByLabel("Filtrar empresa", { exact: true }).selectOption(identities[0].company.id);
  await expect(page.getByText("2 chamadas · página 1", { exact: true })).toBeVisible();
  await page.getByLabel("Filtrar status", { exact: true }).selectOption("failed");
  await expect(page.getByText("1 chamadas · página 1", { exact: true })).toBeVisible();
  await page.getByLabel("Filtrar empresa", { exact: true }).selectOption("");
  await page.getByLabel("Filtrar status", { exact: true }).selectOption("all");
  await page.getByRole("tab", { name: "Tarifas", exact: true }).click();
  await expect(page.getByRole("cell", { name: "gpt-4.1-mini", exact: true })).toBeVisible();
  await page.screenshot({ path: "/workspace/superadmin-consumo-tarifas.png", fullPage: true });
  await page.getByRole("button", { name: "Nova tarifa", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Modelo", { exact: true }).fill("custom-ui-model");
  await dialog.getByLabel("Entrada USD / 1M", { exact: true }).fill("1");
  await dialog.getByLabel("Cache USD / 1M", { exact: true }).fill("0.25");
  await dialog.getByLabel("Saída USD / 1M", { exact: true }).fill("4");
  await dialog
    .getByRole("checkbox", { name: "Aplicar também aos registros ainda sem tarifa", exact: true })
    .check();
  await dialog.getByLabel("Sua senha atual", { exact: true }).fill("Senha-plataforma-123!");
  await dialog.getByRole("button", { name: "Salvar tarifa", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "1 registros calculados" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Consumo", exact: true }).click();
  await page.getByRole("button", { name: "Atualizar consumo", exact: true }).click();
  await expect
    .poll(async () =>
      Number(
        (await (await context.request.get("/api/platform/ai-usage")).json()).summary
          .estimated_cost_usd,
      ),
    )
    .toBe(1.92513);
  await page.getByLabel("Filtrar cálculo", { exact: true }).selectOption("unknown");
  await expect(page.getByText("1 chamadas · página 1", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/workspace/superadmin-consumo-ia-mobile.png", fullPage: true });
  const tenant = await browser.newContext({ baseURL: origin });
  await tenant.request.post("http://127.0.0.1:8400/api/v1/auth/login", {
    headers: { Origin: origin },
    data: { email: `usage-0-${stamp}@example.com`, password: "Senha-segura-123" },
  });
  expect((await tenant.request.get("/api/platform/ai-usage")).status()).toBe(401);
  await tenant.close();
  expect(
    (
      await context.request.post("/api/platform/ai-usage/prices", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
});
