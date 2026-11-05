import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/importacoes")({
  head: () => ({
    meta: [
      { title: "Importações — Superadmin" },
      { name: "description", content: "Histórico de importações de conteúdo." },
      { property: "og:title", content: "Importações — Superadmin" },
      { property: "og:description", content: "Histórico de importações de conteúdo." },
    ],
  }),
  component: () => <PagePlaceholder title="Importações" description="Histórico de importações de conteúdo." />,
});
