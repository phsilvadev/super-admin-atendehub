import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — Superadmin" },
      { name: "description", content: "Registro de ações realizadas na plataforma." },
      { property: "og:title", content: "Auditoria — Superadmin" },
      { property: "og:description", content: "Registro de ações realizadas na plataforma." },
    ],
  }),
  component: () => <PagePlaceholder title="Auditoria" description="Registro de ações realizadas na plataforma." />,
});
