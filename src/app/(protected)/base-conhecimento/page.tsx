import { KnowledgeScreen } from "@/components/screens/knowledge";
export const metadata = { title: "Base de conhecimento" };
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <KnowledgeScreen initialTab={tab === "imports" ? "imports" : "library"} />;
}
