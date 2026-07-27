import type { ProjectRequestKind, RequestStatus } from "@prisma/client";
import Link from "next/link";
import {
  Chip,
  EmptyState,
  HairlineGrid,
  PageHeader,
  UserRow,
} from "@/components/layout";
import { requireOnboardedUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ReadMarker } from "./read-marker";
import { CancelRequest, RequestResponse } from "./request-controls";

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

function StatusBadge({ status }: { status: RequestStatus }) {
  const tone = status === "ACCEPTED" ? "ink" : status === "PENDING" ? "wash" : "paper";
  return <Chip tone={tone}>{status.toLowerCase()}</Chip>;
}

function KindBadge({ kind }: { kind: ProjectRequestKind }) {
  return <Chip>{kind === "INVITE" ? "invite" : "join request"}</Chip>;
}

function SharedTags({ skills, interests }: { skills: string[]; interests: string[] }) {
  const tags = [...skills, ...interests].slice(0, 8);
  if (!tags.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Chip key={tag}>{tag}</Chip>
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
    prisma.projectRequest.findMany({
      where: { toUserId: viewer.id },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: { select: { fullName: true, username: true, imageUrl: true, role: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.projectRequest.findMany({
      where: { fromUserId: viewer.id },
      orderBy: { createdAt: "desc" },
      include: {
        toUser: { select: { fullName: true, username: true, imageUrl: true, role: true } },
        project: { select: { id: true, name: true } },
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
    <>
      <ReadMarker />
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Requests"
          title="Build requests."
          description="Accept to join a roster, decline to keep your focus, and track what you've sent."
        />

        <div className="border-app-divider bg-app-divider flex items-center gap-px self-start border">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={`/inbox?tab=${item.id}`}
                className={
                  active
                    ? "bg-app-ink text-app-paper flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
                    : "bg-app-paper text-app-label hover:text-app-ink flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors"
                }
              >
                {item.label}
                {item.count > 0 ? (
                  <span
                    className={
                      active
                        ? "bg-app-paper text-app-ink rounded-full px-1.5 text-[11px] font-semibold"
                        : "bg-app-chip text-app-label rounded-full px-1.5 text-[11px] font-semibold"
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
            <HairlineGrid>
              {orderedReceived.map((request) => (
                <article
                  key={request.id}
                  className="bg-app-paper grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-start"
                >
                  <UserRow
                    fullName={request.fromUser.fullName}
                    username={request.fromUser.username}
                    imageUrl={request.fromUser.imageUrl}
                    role={request.fromUser.role}
                    meta={
                      <>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <KindBadge kind={request.kind} />
                          <p className="text-app-meta text-xs">{timeAgo(request.createdAt)}</p>
                        </div>
                        <p className="text-app-ink mt-3 text-body">
                          <span className="font-semibold">Build:</span>{" "}
                          <Link
                            href={`/projects/${request.project.id}`}
                            className="underline underline-offset-2"
                          >
                            {request.project.name}
                          </Link>
                        </p>
                        <p className="border-app-ink text-app-body mt-3 max-w-2xl border-l-2 pl-4 text-body leading-6">
                          {request.message}
                        </p>
                        {request.note ? (
                          <p className="text-app-ink mt-3 text-body">
                            <span className="font-semibold">Role note:</span> {request.note}
                          </p>
                        ) : null}
                        <SharedTags skills={request.sharedSkills} interests={request.sharedInterests} />
                      </>
                    }
                  />
                  <div className="lg:text-right">
                    {request.status === "PENDING" ? (
                      <RequestResponse requestId={request.id} />
                    ) : (
                      <StatusBadge status={request.status} />
                    )}
                  </div>
                </article>
              ))}
            </HairlineGrid>
          ) : (
            <EmptyState
              eyebrow="Inbox empty"
              title="No requests yet"
              description="When someone invites you onto a build — or asks to join yours — it lands here."
              action={
                <Link
                  href="/partners"
                  className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-colors"
                >
                  Browse partners
                </Link>
              }
            />
          )
        ) : sent.length ? (
          <HairlineGrid>
            {sent.map((request) => (
              <article
                key={request.id}
                className="bg-app-paper grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-start"
              >
                <UserRow
                  fullName={request.toUser.fullName}
                  username={request.toUser.username}
                  imageUrl={request.toUser.imageUrl}
                  role={request.toUser.role}
                  meta={
                    <>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <KindBadge kind={request.kind} />
                        <p className="text-app-meta text-xs">{timeAgo(request.createdAt)}</p>
                      </div>
                      <p className="text-app-ink mt-3 text-body">
                        <span className="font-semibold">Build:</span>{" "}
                        <Link
                          href={`/projects/${request.project.id}`}
                          className="underline underline-offset-2"
                        >
                          {request.project.name}
                        </Link>
                      </p>
                      <p className="border-app-divider text-app-body mt-3 max-w-2xl border-l-2 pl-4 text-body leading-6">
                        {request.message}
                      </p>
                    </>
                  }
                />
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <StatusBadge status={request.status} />
                  {request.status === "PENDING" ? <CancelRequest requestId={request.id} /> : null}
                </div>
              </article>
            ))}
          </HairlineGrid>
        ) : (
          <EmptyState
            eyebrow="Nothing out"
            title="Nothing sent yet"
            description="Invite someone onto an active project. The request always names the build."
            action={
              <Link
                href="/partners"
                className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-colors"
              >
                Find a partner
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}
