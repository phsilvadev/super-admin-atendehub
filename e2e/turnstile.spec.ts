import { test, expect } from "@playwright/test";
test("Turnstile protege login do superadmin", async ({ page, context }) => {
  test.skip(process.env.E2E_TURNSTILE_TEST !== "1", "Requer chaves públicas oficiais de teste.");
  test.setTimeout(120000);
  const body = { email: "platform@example.com", password: "Senha-plataforma-123!" };
  const response = await context.request.post("/api/platform/auth/login", {
    headers: { Origin: "http://127.0.0.1:3400" },
    data: body,
  });
  expect(response.status()).toBe(403);
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(body.email);
  await page.getByLabel("Senha", { exact: true }).fill(body.password);
  const enter = page.getByRole("button", { name: "Entrar no painel", exact: true });
  await expect(enter).toBeEnabled({ timeout: 45000 });
  await page.screenshot({
    path: "/workspace/atendehub-superadmin-login-turnstile-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: "/workspace/atendehub-superadmin-login-turnstile-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await enter.click();
  await expect(page).toHaveURL(/\/empresas$/, { timeout: 20000 });
});
