import { KnowledgeScreen } from "@/components/screens/knowledge";
export const metadata = { title: "Importações da base de conhecimento" };
export default function Page() {
  return <KnowledgeScreen initialTab="imports" />;
}
