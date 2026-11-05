"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { identitySchema } from "@/lib/auth/contracts";
export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      identitySchema.parse(
        await api("auth/login", {
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        }),
      );
      router.replace("/empresas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto w-full max-w-sm">
      <span className="mb-7 grid size-12 place-items-center rounded-2xl bg-accent/40 text-brand">
        <ShieldCheck className="size-6" />
      </span>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Acesso à plataforma
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Bem-vindo de volta</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Entre para gerenciar as empresas e acompanhar a operação do AtendeHub.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
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
              className="h-12 rounded-xl bg-card"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
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
                className="h-12 rounded-xl bg-card pr-12"
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
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Button disabled={busy} className="h-12 w-full rounded-xl" type="submit">
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
      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        Acesso exclusivo à administração da plataforma.
        <br />
        Seu acesso é fornecido pelo administrador da plataforma.
      </p>
    </div>
  );
}
