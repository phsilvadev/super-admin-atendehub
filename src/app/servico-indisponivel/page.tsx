export const metadata = { title: "Serviço indisponível" };
export default function Unavailable() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Serviço temporariamente indisponível</h1>
        <p className="text-muted-foreground">
          Não foi possível validar seu acesso. Tente novamente em instantes.
        </p>
        <a
          href="/empresas"
          className="inline-block rounded-xl bg-primary px-6 py-3 text-primary-foreground"
        >
          Tentar novamente
        </a>
      </div>
    </main>
  );
}
