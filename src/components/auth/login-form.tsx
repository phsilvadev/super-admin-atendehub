"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AntiBotChallenge, type AntiBotState } from "./anti-bot";
import { api } from "@/lib/api/client";
import { identitySchema } from "@/lib/auth/contracts";
export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState<AntiBotState>({
    ready: false,
    enabled: true,
    token: "",
  });
  const [challengeReset, setChallengeReset] = useState(0);
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !challenge.ready) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      identitySchema.parse(
        await api("auth/login", {
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
          ...(challenge.token ? { challenge_token: challenge.token } : {}),
        }),
      );
      router.replace("/empresas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
      setBusy(false);
    } finally {
      if (challenge.enabled) {
        setChallenge({ ready: false, enabled: true, token: "" });
        setChallengeReset((value) => value + 1);
      }
    }
  }
  return (
    <div className="mx-auto w-full max-w-sm">
      <div data-access-heading className="text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
          <LockKeyhole className="size-3" />
          Acesso à plataforma
        </span>
        <h1 className="text-[28px] font-semibold tracking-tight">Bem-vindo de volta</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
          Entre com sua conta para acessar
          <br className="hidden sm:block" /> a administração do AtendeHub.
        </p>
      </div>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-medium">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              placeholder="voce@empresa.com.br"
              className="h-12 rounded-xl border-transparent bg-secondary/70 shadow-none focus-visible:border-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-medium">
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={128}
                className="h-12 rounded-xl border-transparent bg-secondary/70 pr-12 shadow-none focus-visible:border-ring"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-lg p-3 text-muted-foreground"
                aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={visible}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </fieldset>
        <AntiBotChallenge
          action="platform_login"
          configPath="/api/platform/auth/challenge"
          resetKey={challengeReset}
          onState={setChallenge}
        />
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Button
          disabled={busy || !challenge.ready}
          className="h-12 w-full rounded-xl"
          type="submit"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Entrando…
            </>
          ) : (
            <>
              Entrar no painel
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
      <p className="mx-auto mt-6 max-w-xs text-center text-[11px] leading-5 text-muted-foreground">
        Precisa de acesso? Fale com o administrador responsável pela plataforma.
      </p>
    </div>
  );
}
