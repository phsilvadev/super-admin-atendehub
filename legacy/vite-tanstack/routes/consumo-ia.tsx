import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/consumo-ia")({
  head: () => ({
    meta: [
      { title: "Consumo de IA — Superadmin" },
      { name: "description", content: "Acompanhe o uso e o custo de IA por empresa." },
      { property: "og:title", content: "Consumo de IA — Superadmin" },
      { property: "og:description", content: "Acompanhe o uso e o custo de IA por empresa." },
    ],
  }),
  component: () => <PagePlaceholder title="Consumo de IA" description="Acompanhe o uso e o custo de IA por empresa." />,
});
