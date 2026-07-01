import type { RequestStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ReadMarker } from "./read-marker";
import { CancelRequest, RequestResponse } from "./request-controls";

const ROLE_LABEL: Record<UserRole, string> = {
  BUILDER: "Builder",
  SPECIALIST: "Specialist",
  LEARNER: "Learner",
};

type Person = {
  fullName: string | null;
  username: string | null;
  imageUrl: string | null;
  role: UserRole | null;
};

function displayName(user: Person): string {
  return user.fullName || user.username || "KCL builder";
}

function initials(user: Person): string {
  const base = user.fullName || user.username || "K B";
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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

const STATUS_STYLE: Record<RequestStatus, string> = {
  PENDING: "border-[#d8d8d8] bg-[#f4f4f4] text-[#555555]",
  ACCEPTED: "border-[#000000] bg-[#000000] text-[#ffffff]",
  DECLINED: "border-[#d8d8d8] bg-[#ffffff] text-[#999999]",
  CANCELLED: "border-[#d8d8d8] bg-[#ffffff] text-[#999999]",
};

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] uppercase ${STATUS_STYLE[status]}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function Avatar({ user }: { user: Person }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d8d8d8] bg-[#f4f4f4] text-sm font-semibold text-[#555555]">
      {user.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.imageUrl} alt={displayName(user)} className="h-full w-full object-cover" />
      ) : (
        initials(user)
      )}
    </div>
  );
}

function SharedTags({ skills, interests }: { skills: string[]; interests: string[] }) {
  const tags = [...skills, ...interests].slice(0, 8);
  if (!tags.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-0.5 text-[11px] text-[#555555]">
          {tag}
        </span>
      ))}
    </div>
  );
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await requireOnboardedUser();
  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab = rawTab === "sent" ? "sent" : "received";

  const [received, sent] = await Promise.all([
    prisma.partnershipRequest.findMany({
      where: { toUserId: viewer.id },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: { select: { fullName: true, username: true, imageUrl: true, role: true } },
        relatedProject: { select: { id: true, name: true } },
      },
    }),
    prisma.partnershipRequest.findMany({
      where: { fromUserId: viewer.id },
      orderBy: { createdAt: "desc" },
      include: {
        toUser: { select: { fullName: true, username: true, imageUrl: true, role: true } },
        relatedProject: { select: { id: true, name: true } },
      },
    }),
  ]);

  const pendingReceived = received.filter((request) => request.status === "PENDING");
  const resolvedReceived = received.filter((request) => request.status !== "PENDING");
  const orderedReceived = [...pendingReceived, ...resolvedReceived];

  const tabs = [
    { id: "received", label: "Received", count: pendingReceived.length },
    { id: "sent", label: "Sent", count: sent.length },
  ] as const;

  return (
    <AppShell>
      <ReadMarker />
      <div className="flex flex-col gap-8">
        <header>
          <p className="text-[12px] font-semibold tracking-[0.3em] text-[#555555] uppercase">Requests</p>
          <h1 className="mt-5 font-serif text-[clamp(2.5rem,5vw,4.4rem)] leading-[0.98] font-light tracking-[-0.04em]">
            Partnership requests.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#333333]">
            Accept to form a partnership, decline to keep
            your focus, and track what you've sent.
          </p>
        </header>

        <div className="flex items-center gap-px border border-[#d8d8d8] bg-[#d8d8d8] self-start">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={`/inbox?tab=${item.id}`}
                className={
                  active
                    ? "flex items-center gap-2 bg-[#000000] px-5 py-2.5 text-sm font-medium text-[#ffffff]"
                    : "flex items-center gap-2 bg-[#ffffff] px-5 py-2.5 text-sm font-medium text-[#555555] transition-colors hover:text-[#000000]"
                }
              >
                {item.label}
                {item.count > 0 ? (
                  <span
                    className={
                      active
                        ? "rounded-full bg-[#ffffff] px-1.5 text-[11px] font-semibold text-[#000000]"
                        : "rounded-full bg-[#f4f4f4] px-1.5 text-[11px] font-semibold text-[#555555]"
                    }
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {tab === "received" ? (
          orderedReceived.length ? (
            <section className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8]">
              {orderedReceived.map((request) => (
                <article key={request.id} className="grid gap-5 bg-[#ffffff] p-6 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="flex gap-4">
                    <Avatar user={request.fromUser} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold">{displayName(request.fromUser)}</p>
                        {request.fromUser.username ? (
                          <span className="text-sm text-[#999999]">@{request.fromUser.username}</span>
                        ) : null}
                        {request.fromUser.role ? (
                          <span className="border border-[#d8d8d8] bg-[#f4f4f4] px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#555555] uppercase">
                            {ROLE_LABEL[request.fromUser.role]}
                          </span>
                        ) : null}
                        <span className="text-xs text-[#999999]">{timeAgo(request.createdAt)}</span>
                      </div>
                      <p className="mt-3 max-w-2xl border-l-2 border-[#000000] pl-4 text-sm leading-6 text-[#333333]">
                        {request.message}
                      </p>
                      {request.projectInterest ? (
                        <p className="mt-3 text-sm text-[#111111]">
                          <span className="font-semibold">Wants to build:</span> {request.projectInterest}
                        </p>
                      ) : null}
                      {request.relatedProject ? (
                        <p className="mt-2 text-sm text-[#111111]">
                          <span className="font-semibold">Related project:</span>{" "}
                          <Link href={`/projects/${request.relatedProject.id}`} className="underline underline-offset-2">
                            {request.relatedProject.name}
                          </Link>
                        </p>
                      ) : null}
                      <SharedTags skills={request.sharedSkills} interests={request.sharedInterests} />
                    </div>
                  </div>
                  <div className="lg:text-right">
                    {request.status === "PENDING" ? (
                      <RequestResponse requestId={request.id} />
                    ) : (
                      <StatusBadge status={request.status} />
                    )}
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className="border border-[#d8d8d8] bg-[#f7f7f7] p-8">
              <h2 className="font-serif text-2xl font-light">No requests yet</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#333333]">
                When a builder asks to partner with you, it lands here. Keep your profile sharp and your
                projects public so the right people reach out.
              </p>
              <Link
                href="/partners"
                className="mt-6 inline-flex h-9 items-center rounded-full bg-[#000000] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#333333]"
              >
                Browse partners
              </Link>
            </section>
          )
        ) : sent.length ? (
          <section className="grid gap-px border border-[#d8d8d8] bg-[#d8d8d8]">
            {sent.map((request) => (
              <article key={request.id} className="grid gap-5 bg-[#ffffff] p-6 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="flex gap-4">
                  <Avatar user={request.toUser} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold">{displayName(request.toUser)}</p>
                      {request.toUser.username ? (
                        <span className="text-sm text-[#999999]">@{request.toUser.username}</span>
                      ) : null}
                      <span className="text-xs text-[#999999]">{timeAgo(request.createdAt)}</span>
                    </div>
                    <p className="mt-3 max-w-2xl border-l-2 border-[#d8d8d8] pl-4 text-sm leading-6 text-[#333333]">
                      {request.message}
                    </p>
                    {request.relatedProject ? (
                      <p className="mt-3 text-sm text-[#111111]">
                        <span className="font-semibold">Related project:</span>{" "}
                        <Link href={`/projects/${request.relatedProject.id}`} className="underline underline-offset-2">
                          {request.relatedProject.name}
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <StatusBadge status={request.status} />
                  {request.status === "PENDING" ? <CancelRequest requestId={request.id} /> : null}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="border border-[#d8d8d8] bg-[#f7f7f7] p-8">
            <h2 className="font-serif text-2xl font-light">Nothing sent yet</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#333333]">
              Find a builder whose skills fill your gap. Attach a note to make it personal.
            </p>
            <Link
              href="/partners"
              className="mt-6 inline-flex h-9 items-center rounded-full bg-[#000000] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#333333]"
            >
              Find a partner
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}
