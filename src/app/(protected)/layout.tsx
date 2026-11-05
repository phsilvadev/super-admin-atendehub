import type { ReactNode } from "react";
import { requirePlatform } from "@/lib/auth/server";
import { AppShell } from "@/components/app-shell";
import { SessionGuard } from "@/components/auth/session-guard";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const identity = await requirePlatform();
  return (
    <SessionGuard id={identity.id}>
      <AppShell identity={identity}>{children}</AppShell>
    </SessionGuard>
  );
}
