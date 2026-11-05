import { requirePlatform } from "@/lib/auth/server";
import { CompaniesScreen } from "@/components/screens/companies";
export const metadata = { title: "Empresas" };
export default async function CompaniesPage() {
  await requirePlatform();
  return <CompaniesScreen />;
}
