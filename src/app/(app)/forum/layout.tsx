import type { ReactNode } from "react";

export default function ForumLayout({ children }: { children: ReactNode }) {
  return <section className="forum-theme flex flex-1 flex-col p-3 sm:p-5">{children}</section>;
}
