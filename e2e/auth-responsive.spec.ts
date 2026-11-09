import { test, expect } from "@playwright/test";
test("superadmin: painel com moldura e login sem scroll em notebook", async ({ page }) => {
  await page.addInitScript(() => {
    window.turnstile = {
      render(element: HTMLElement, options: Record<string, unknown>) {
        element.style.height = "65px";
        element.style.border = "1px solid #ddd";
        element.style.borderRadius = "8px";
        element.style.display = "grid";
        element.style.placeItems = "center";
        element.textContent = "Verificação de segurança";
        (options["callback"] as (value: string) => void)("test-only-layout-token");
        return "layout-widget";
      },
      remove() {},
    };
  });
  await page.route("**/api/platform/auth/challenge", (route) =>
    route.fulfill({ json: { enabled: true, testing: false, site_key: "test-only-layout-key" } }),
  );
  for (const height of [768, 650]) {
    await page.setViewportSize({ width: 1366, height });
    await page.goto("/login");
    await expect(page.getByText("Verificação de segurança", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
    ).toBe(true);
    const panel = page.locator("main aside");
    const bounds = await panel.boundingBox();
    expect(bounds?.x).toBe(8);
    expect(bounds?.y).toBe(8);
    expect(bounds?.height).toBe(height - 16);
    expect(await panel.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
    await page.screenshot({
      path: `/workspace/superadmin-login-notebook-${height}-moldura.png`,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({
    path: "/workspace/superadmin-login-moldura-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Entrar no painel", exact: true })).toBeVisible();
  await page.screenshot({
    path: "/workspace/superadmin-login-moldura-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
