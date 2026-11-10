import { z } from "zod";
import { api } from "./client";
const money = z.string().regex(/^\d+(?:\.\d+)?$/);
export const usageSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      created_at: z.number(),
      company_id: z.string().uuid(),
      company_name: z.string(),
      user_name: z.string(),
      user_email: z.string(),
      feature: z.string(),
      model: z.string(),
      resolved_model: z.string().nullable(),
      service_tier: z.string().nullable(),
      status: z.string(),
      input_tokens: z.number().int().nullable(),
      output_tokens: z.number().int().nullable(),
      cached_tokens: z.number().int().nullable(),
      pricing_status: z.string(),
      cost_usd: money.nullable(),
      price_id: z.string().uuid().nullable(),
    }),
  ),
  total: z.number().int(),
  summary: z.object({
    requests: z.number().int(),
    input_tokens: z.number().int(),
    output_tokens: z.number().int(),
    cached_tokens: z.number().int(),
    measured_requests: z.number().int(),
    unmeasured_requests: z.number().int(),
    valued_requests: z.number().int(),
    unpriced_requests: z.number().int(),
    estimated_cost_usd: money.nullable(),
  }),
  by_company: z.array(
    z.object({
      company_id: z.string().uuid(),
      company_name: z.string(),
      requests: z.number().int(),
      input_tokens: z.number().int(),
      output_tokens: z.number().int(),
      cost_usd: money.nullable(),
      unpriced: z.number().int(),
    }),
  ),
  companies: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  users: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  models: z.array(z.string()),
  currency: z.literal("USD"),
  timezone: z.literal("America/Sao_Paulo"),
  feature_scope: z.literal("support"),
  poll_seconds: z.number().int(),
});
export const priceSchema = z.object({
  id: z.string().uuid(),
  model: z.string(),
  input_usd: money,
  cached_usd: money,
  output_usd: money,
  effective_from: z.number(),
  source_url: z.string().url(),
  created_at: z.number(),
});
export type Usage = z.infer<typeof usageSchema>;
export type Price = z.infer<typeof priceSchema>;
export async function getUsage(filters: Record<string, string>) {
  return usageSchema.parse(
    await api(
      `ai-usage?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "")))}`,
    ),
  );
}
export async function getPrices(offset: number) {
  return z
    .object({ items: z.array(priceSchema), total: z.number().int(), currency: z.literal("USD") })
    .parse(await api(`ai-usage/prices?offset=${offset}&limit=20`));
}
export async function addPrice(body: unknown) {
  return priceSchema
    .extend({ applied_records: z.number().int(), remaining_records: z.number().int() })
    .parse(await api("ai-usage/prices", body));
}
export async function applyPrice(price: Price, password: string) {
  return z
    .object({ applied_records: z.number().int(), remaining_records: z.number().int() })
    .parse(await api(`ai-usage/prices/${price.id}/apply`, { current_password: password }));
}
export function usd(value: string | null) {
  if (value === null) return "Não calculado";
  const amount = Number(value);
  if (amount > 0 && amount < 1e-12) return "< US$ 0,000000000001";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 6,
    maximumFractionDigits: 12,
  }).format(amount);
}
export function count(value: number | null) {
  return value === null ? "Não informado" : new Intl.NumberFormat("pt-BR").format(value);
}
export const pricingLabels: Record<string, string> = {
  calculated: "Calculado",
  estimated_cache: "Cache não informado",
  estimated_legacy: "Estimativa histórica",
  unknown_price: "Sem tarifa",
  unknown_usage: "Consumo não informado",
  unknown_tier: "Modalidade sem tarifa",
};
export const stateLabels: Record<string, string> = {
  processing: "Em processamento",
  complete: "Concluído",
  failed: "Falha",
  interrupted: "Interrompido",
};
export function localDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function initialStart() {
  const value = new Date(localDate() + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() - 29);
  return value.toISOString().slice(0, 10);
}
