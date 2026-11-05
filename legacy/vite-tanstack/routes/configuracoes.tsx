import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Superadmin" },
      { name: "description", content: "Preferências gerais da plataforma." },
      { property: "og:title", content: "Configurações — Superadmin" },
      { property: "og:description", content: "Preferências gerais da plataforma." },
    ],
  }),
  component: () => <PagePlaceholder title="Configurações" description="Preferências gerais da plataforma." />,
});
