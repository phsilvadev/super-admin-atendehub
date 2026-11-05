import { z } from "zod";
import { api } from "./client";
export const companyStates = ["active", "trial", "trial_expired", "inactive"] as const;
export type CompanyState = (typeof companyStates)[number];
export const stateLabels: Record<CompanyState, string> = {
  active: "Ativa",
  trial: "Em teste",
  trial_expired: "Teste encerrado",
  inactive: "Inativa",
};
const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  legal_name: z.string(),
  tax_id: z.string(),
  email: z.string(),
  administrator: z.object({ name: z.string(), email: z.string() }).nullable(),
  plan_code: z.string(),
  plan_name: z.string(),
  status: z.enum(companyStates),
  registered_at: z.number(),
  trial_ends_at: z.number().nullable(),
});
export const companiesSchema = z.object({
  items: z.array(companySchema),
  total: z.number().int().nonnegative(),
  summary: z.object({
    total: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
    trial: z.number().int().nonnegative(),
    trial_expired: z.number().int().nonnegative(),
    inactive: z.number().int().nonnegative(),
  }),
});
export type Companies = z.infer<typeof companiesSchema>;
export async function getCompanies(q: string, status: string, offset: number) {
  return companiesSchema.parse(
    await api(
      `companies?${new URLSearchParams({ q, status, offset: String(offset), limit: "20" })}`,
    ),
  );
}
export function formatDate(value: number | null) {
  return value === null
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(value * 1000));
}
export function taxId(value: string) {
  return value.length === 14
    ? value.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, "$1.$2.$3/$4-$5")
    : value;
}
