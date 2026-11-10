import { z } from "zod";
import { api } from "./client";
export const administratorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  version: z.number().int(),
  is_primary: z.boolean(),
  is_self: z.boolean(),
  can_edit: z.boolean(),
  can_deactivate: z.boolean(),
});
export type Administrator = z.infer<typeof administratorSchema>;
export const aiSchema = z.object({
  model: z.string(),
  version: z.number().int(),
  configured: z.boolean(),
  storage_ready: z.boolean(),
  checked_at: z.number().nullable(),
  check_status: z.string().nullable(),
  can_manage: z.boolean(),
  diagnostic_only: z.literal(true),
});
export type AIConfig = z.infer<typeof aiSchema>;
export const diagnosticLabels: Record<string, string> = {
  verified: "Acesso ao modelo confirmado",
  invalid_key: "Chave não aceita pela OpenAI",
  forbidden: "A chave não tem permissão para este recurso",
  model_unavailable: "Modelo indisponível para esta chave",
  rate_limited: "Limite do provedor atingido. Tente novamente depois",
  unavailable: "Não foi possível confirmar o acesso. Tente novamente",
};
export async function getAI() {
  return aiSchema.parse(await api("settings/openai"));
}
export async function saveAI(data: unknown) {
  return aiSchema.parse(await api("settings/openai", data, "PATCH"));
}
export async function actionAI(action: "test" | "remove", data: unknown) {
  return aiSchema.parse(await api(`settings/openai/${action}`, data));
}
export async function getAdmins(q: string, offset: number) {
  return z
    .object({ items: z.array(administratorSchema), total: z.number().int() })
    .parse(
      await api(
        `administrators?${new URLSearchParams({ q, offset: String(offset), limit: "20" })}`,
      ),
    );
}
export async function saveAdmin(admin: Administrator | null, data: unknown) {
  return administratorSchema
    .extend({ requires_login: z.boolean().optional() })
    .parse(
      await api(
        admin ? `administrators/${admin.id}` : "administrators",
        data,
        admin ? "PATCH" : "POST",
      ),
    );
}
