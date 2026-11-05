import { z } from "zod";
export const PLATFORM_COOKIE = "atendehub_platform_session";
export const identitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.literal("platform_admin"),
});
export type Identity = z.infer<typeof identitySchema>;
