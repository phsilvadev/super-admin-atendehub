import { cleanup, render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AntiBotChallenge } from "./anti-bot";
let options: Record<string, unknown>;
const renderWidget = vi.fn((_element: HTMLElement, value: Record<string, unknown>) => {
  options = value;
  return "widget-1";
});
const removeWidget = vi.fn();
beforeEach(() => {
  window.turnstile = { render: renderWidget, remove: removeWidget };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({ enabled: true, site_key: "unit-public-site-key", testing: false }),
          ),
      ),
  );
});
afterEach(() => {
  cleanup();
  delete window.turnstile;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("Verificação antirrobô", () => {
  it("permanece bloqueada até validar e limpa token ao expirar", async () => {
    const onState = vi.fn();
    render(
      <AntiBotChallenge
        action="client_login"
        configPath="/api/auth/challenge"
        resetKey={0}
        onState={onState}
      />,
    );
    expect(onState).toHaveBeenLastCalledWith({ ready: false, enabled: true, token: "" });
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1));
    expect(options["action"]).toBe("client_login");
    act(() => {
      (options["callback"] as (token: string) => void)("verified-token");
    });
    expect(onState).toHaveBeenLastCalledWith({
      ready: true,
      enabled: true,
      token: "verified-token",
    });
    act(() => {
      (options["expired-callback"] as () => void)();
    });
    expect(onState).toHaveBeenLastCalledWith({ ready: false, enabled: true, token: "" });
    expect(await screen.findByRole("alert")).toHaveTextContent("expirou");
  });
  it("remove e recria o desafio após uma tentativa de login", async () => {
    const onState = vi.fn();
    const props = {
      action: "platform_login" as const,
      configPath: "/api/platform/auth/challenge",
      onState,
    };
    const view = render(<AntiBotChallenge {...props} resetKey={0} />);
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1));
    view.rerender(<AntiBotChallenge {...props} resetKey={1} />);
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(2));
    expect(removeWidget).toHaveBeenCalledWith("widget-1");
    expect(onState).toHaveBeenLastCalledWith({ ready: false, enabled: true, token: "" });
  });
  it("bloqueia quando a configuração falha e oferece tentar novamente", async () => {
    const onState = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 503 }));
    render(
      <AntiBotChallenge
        action="client_register"
        configPath="/api/auth/challenge"
        resetKey={0}
        onState={onState}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("proteção de acesso");
    expect(onState).toHaveBeenLastCalledWith({ ready: false, enabled: true, token: "" });
    fireEvent.click(screen.getByRole("button", { name: "Tentar verificação novamente" }));
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1));
  });
  it("permite desativação explícita do backend apenas nos ambientes permitidos", async () => {
    const onState = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ enabled: false, site_key: null })),
    );
    render(
      <AntiBotChallenge
        action="client_login"
        configPath="/api/auth/challenge"
        resetKey={0}
        onState={onState}
      />,
    );
    await waitFor(() =>
      expect(onState).toHaveBeenLastCalledWith({ ready: true, enabled: false, token: "" }),
    );
    expect(renderWidget).not.toHaveBeenCalled();
  });
});
