import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — Superadmin" },
      { name: "description", content: "Configure os planos e assinaturas." },
      { property: "og:title", content: "Planos — Superadmin" },
      { property: "og:description", content: "Configure os planos e assinaturas." },
    ],
  }),
  component: () => <PagePlaceholder title="Planos" description="Configure os planos e assinaturas." />,
});
