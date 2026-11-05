import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — Superadmin" },
      { name: "description", content: "Gerencie as empresas clientes da plataforma." },
      { property: "og:title", content: "Empresas — Superadmin" },
      { property: "og:description", content: "Gerencie as empresas clientes da plataforma." },
    ],
  }),
  component: () => <PagePlaceholder title="Empresas" description="Gerencie as empresas clientes da plataforma." />,
});
