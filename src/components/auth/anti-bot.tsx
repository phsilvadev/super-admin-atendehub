"use client";
import { useEffect, useRef, useState } from "react";
export type AntiBotState = { ready: boolean; enabled: boolean; token: string };
type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
let loadingScript: Promise<Turnstile> | null = null;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loadingScript) return loadingScript;
  loadingScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(fail, 12000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      loadingScript = null;
      reject(new Error("Não foi possível carregar a verificação de segurança."));
    }
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.turnstile) {
        fail();
        return;
      }
      window.clearTimeout(timeout);
      resolve(window.turnstile);
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loadingScript;
}
export function AntiBotChallenge({
  action,
  configPath,
  resetKey,
  onState,
}: {
  action: "client_login" | "client_register" | "platform_login";
  configPath: string;
  resetKey: number;
  onState: (state: AntiBotState) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    let api: Turnstile | undefined;
    let widget: string | undefined;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    onState({ ready: false, enabled: true, token: "" });
    setError("");
    setTesting(false);
    setLoading(true);
    async function mount() {
      try {
        const response = await fetch(configPath, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Não foi possível consultar a proteção de acesso.");
        const config: unknown = await response.json();
        if (
          !config ||
          typeof config !== "object" ||
          !("enabled" in config) ||
          typeof config.enabled !== "boolean"
        )
          throw new Error("Configuração de segurança inválida.");
        if (!alive) return;
        if (!config.enabled) {
          onState({ ready: true, enabled: false, token: "" });
          setLoading(false);
          return;
        }
        if (
          !("site_key" in config) ||
          typeof config.site_key !== "string" ||
          !config.site_key ||
          config.site_key.length > 200
        )
          throw new Error("A proteção de acesso ainda não foi configurada.");
        setTesting("testing" in config && config.testing === true);
        api = await loadTurnstile();
        if (!alive || !container.current) return;
        widget = api.render(container.current, {
          sitekey: config.site_key,
          action,
          theme: "light",
          size: "flexible",
          language: "pt-br",
          appearance: "always",
          "response-field": false,
          callback: (token: string) => {
            if (alive) {
              onState({ ready: true, enabled: true, token });
              setError("");
            }
          },
          "expired-callback": () => {
            if (alive) {
              onState({ ready: false, enabled: true, token: "" });
              setError("A verificação expirou. Confirme novamente.");
            }
          },
          "error-callback": () => {
            if (alive) {
              onState({ ready: false, enabled: true, token: "" });
              setError("Não foi possível verificar. Tente novamente.");
            }
          },
          "timeout-callback": () => {
            if (alive) {
              onState({ ready: false, enabled: true, token: "" });
              setError("O tempo da verificação terminou. Tente novamente.");
            }
          },
        });
        setLoading(false);
      } catch (e) {
        if (alive) {
          setLoading(false);
          setError(
            e instanceof Error ? e.message : "A verificação de segurança está indisponível.",
          );
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void mount();
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(timeout);
      if (api && widget !== undefined) api.remove(widget);
    };
  }, [action, configPath, resetKey, retry, onState]);
  return (
    <div className="min-w-0 space-y-2" aria-label="Verificação antirrobô">
      <div ref={container} className="min-w-0 overflow-hidden rounded-lg" />
      {loading && (
        <p role="status" className="text-xs text-neutral-500">
          Carregando verificação de segurança…
        </p>
      )}
      {testing && (
        <p className="text-[11px] text-neutral-500">
          Verificação em modo de teste de desenvolvimento.
        </p>
      )}
      {error && (
        <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p role="alert" className="text-xs leading-relaxed text-neutral-600">
            {error}
          </p>
          <button
            type="button"
            className="text-xs font-medium underline underline-offset-4"
            onClick={() => setRetry((value) => value + 1)}
          >
            Tentar verificação novamente
          </button>
        </div>
      )}
    </div>
  );
}
