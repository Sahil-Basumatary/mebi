import Link from "next/link";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";

function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

export default async function InboxRail() {
  const viewer = await requireOnboardedUser();
  const pending = await prisma.projectRequest.findMany({
    where: { toUserId: viewer.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      message: true,
      createdAt: true,
      kind: true,
      fromUser: { select: { fullName: true, username: true } },
      project: { select: { name: true } },
    },
  });

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-app-label text-meta font-semibold tracking-rail uppercase">Pending</p>
        <p className="text-app-body mt-3 text-body-sm leading-6">
          Build invites and join requests waiting on you.
        </p>
      </div>
      {pending.length ? (
        <ul className="border-app-divider divide-app-divider divide-y border">
          {pending.map((request) => {
            const name = displayName(request.fromUser.fullName, request.fromUser.username);
            return (
              <li key={request.id}>
                <Link
                  href="/inbox?tab=received"
                  className="bg-app-paper hover:bg-app-wash block p-4 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-app-ink truncate text-sm font-medium">{name}</p>
                    <span className="text-app-meta shrink-0 text-xs">{timeAgo(request.createdAt)}</span>
                  </div>
                  <p className="text-app-label mt-1 truncate font-mono text-chip tracking-meta uppercase">
                    {request.kind === "INVITE" ? "Invite" : "Join"} · {request.project.name}
                  </p>
                  <p className="text-app-body mt-2 line-clamp-2 text-body-sm leading-5">
                    {request.message}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-app-body text-body-sm leading-6">
          No pending requests. When someone reaches out about a build, a preview shows up here.
        </p>
      )}
    </div>
  );
}
