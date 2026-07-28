import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusSpine } from "@/components/layout/status-spine";

export default function AppLayout({
  children,
  rail,
}: {
  children: ReactNode;
  rail: ReactNode;
}) {
  return (
    <AppShell rail={rail} spine={<StatusSpine />}>
      {children}
    </AppShell>
  );
}
