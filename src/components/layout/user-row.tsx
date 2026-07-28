import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";
import { displayName, initials, ROLE_LABEL } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type UserRowProps = {
  fullName: string | null;
  username: string | null;
  imageUrl?: string | null;
  role?: UserRole | null;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function UserRow({
  fullName,
  username,
  imageUrl,
  role,
  meta,
  action,
  className,
}: UserRowProps) {
  const name = displayName(fullName, username);
  const mark = initials(fullName, username);

  return (
    <div className={cn("flex items-start gap-4", className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="border-app-divider h-11 w-11 shrink-0 border object-cover" />
      ) : (
        <span className="border-app-divider bg-app-wash text-app-label flex h-11 w-11 shrink-0 items-center justify-center border font-mono text-chip tracking-meta">
          {mark}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-app-ink text-sm font-medium">{name}</p>
          {username ? (
            <span className="text-app-meta font-mono text-chip tracking-meta">@{username}</span>
          ) : null}
          {role ? (
            <span className="border-app-divider bg-app-chip text-app-label border px-2 py-0.5 text-chip font-semibold tracking-chip uppercase">
              {ROLE_LABEL[role]}
            </span>
          ) : null}
        </div>
        {meta}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
