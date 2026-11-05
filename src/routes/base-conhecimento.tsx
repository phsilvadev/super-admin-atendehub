import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/base-conhecimento")({
  head: () => ({
    meta: [
      { title: "Base de conhecimento — Superadmin" },
      { name: "description", content: "Conteúdos da base comum." },
      { property: "og:title", content: "Base de conhecimento — Superadmin" },
      { property: "og:description", content: "Conteúdos da base comum." },
    ],
  }),
  component: () => <PagePlaceholder title="Base de conhecimento" description="Conteúdos da base comum." />,
});
