import type { ProjectRequestKind, RequestStatus } from "@prisma/client";
import Link from "next/link";
import {
  AppTabs,
  Chip,
  DataList,
  DataRow,
  EmptyState,
  MetaLine,
  PageHeader,
  UserRow,
} from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";
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

function safeNotificationHref(href: string | null): string {
  if (href && href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) {
    return href;
  }
  return "/inbox";
}

function SharedTags({ skills, interests }: { skills: string[]; interests: string[] }) {
  const tags = [...skills, ...interests].slice(0, 8);
  if (!tags.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
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
  const tab = rawTab === "sent" ? "sent" : rawTab === "activity" ? "activity" : "received";

  const [received, sent, activity] = await Promise.all([
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
    prisma.notification.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        message: true,
        href: true,
        read: true,
        createdAt: true,
      },
    }),
  ]);

  const pendingReceived = received.filter((request) => request.status === "PENDING");
  const resolvedReceived = received.filter((request) => request.status !== "PENDING");
  const orderedReceived = [...pendingReceived, ...resolvedReceived];

  const unreadActivity = activity.filter((item) => !item.read).length;
  const tabs = [
    {
      id: "received",
      label: "Received",
      count: pendingReceived.length,
      href: "/inbox?tab=received",
    },
    { id: "sent", label: "Sent", count: sent.length, href: "/inbox?tab=sent" },
    {
      id: "activity",
      label: "Activity",
      count: unreadActivity,
      href: "/inbox?tab=activity",
    },
  ] as const;

  return (
    <>
      <ReadMarker includeForum={tab === "activity"} />
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader eyebrow="Requests" title="Inbox" />

        <AppTabs items={tabs} active={tab} ariaLabel="Inbox folders" className="self-start" />

        {tab === "activity" ? (
          activity.length ? (
            <DataList ariaLabel="Activity">
              {activity.map((item) => {
                const href = safeNotificationHref(item.href);
                return (
                  <DataRow
                    key={item.id}
                    className="hover:bg-app-wash grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-app-ink text-sm leading-5">{item.message}</p>
                      <MetaLine className="mt-2">
                        <span>{timeAgo(item.createdAt)}</span>
                        <span aria-hidden>·</span>
                        <span>{item.type === "FORUM_REPLY" ? "Forum" : "Request"}</span>
                        {!item.read ? <Chip tone="ink">new</Chip> : null}
                      </MetaLine>
                    </div>
                    <AppButton asChild variant="secondary" size="sm">
                      <Link href={href}>Open</Link>
                    </AppButton>
                  </DataRow>
                );
              })}
            </DataList>
          ) : (
            <EmptyState
              fill
              eyebrow="Quiet"
              title="No activity yet."
              description="Forum replies and request updates will land here."
              action={
                <AppButton asChild>
                  <Link href="/forum">Open the forum</Link>
                </AppButton>
              }
            />
          )
        ) : tab === "received" ? (
          orderedReceived.length ? (
            <DataList ariaLabel="Received requests">
              {orderedReceived.map((request) => (
                <DataRow
                  key={request.id}
                  className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                >
                  <UserRow
                    fullName={request.fromUser.fullName}
                    username={request.fromUser.username}
                    imageUrl={request.fromUser.imageUrl}
                    role={request.fromUser.role}
                    meta={
                      <>
                        <MetaLine className="mt-1.5">
                          <KindBadge kind={request.kind} />
                          <span>{timeAgo(request.createdAt)}</span>
                        </MetaLine>
                        <p className="text-app-ink mt-2 text-sm">
                          <Link
                            href={`/projects/${request.project.id}`}
                            className="font-semibold underline underline-offset-2"
                          >
                            {request.project.name}
                          </Link>
                        </p>
                        <p className="border-app-ink text-app-body mt-2 line-clamp-2 max-w-3xl border-l-2 pl-3 text-sm leading-5">
                          {request.message}
                        </p>
                        {request.note ? (
                          <p className="text-app-ink mt-2 text-sm">
                            <span className="font-semibold">Role note:</span> {request.note}
                          </p>
                        ) : null}
                        <SharedTags
                          skills={request.sharedSkills}
                          interests={request.sharedInterests}
                        />
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
                </DataRow>
              ))}
            </DataList>
          ) : (
            <EmptyState
              fill
              eyebrow="Inbox empty"
              title="No requests yet."
              description="Invites and join requests will appear here."
              action={
                <div className="flex flex-wrap gap-3">
                  <AppButton asChild>
                    <Link href="/partners">Browse partners</Link>
                  </AppButton>
                  <AppButton asChild variant="secondary">
                    <Link href="/discover">Browse builds</Link>
                  </AppButton>
                </div>
              }
            />
          )
        ) : sent.length ? (
          <DataList ariaLabel="Sent requests">
            {sent.map((request) => (
              <DataRow
                key={request.id}
                className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
              >
                <UserRow
                  fullName={request.toUser.fullName}
                  username={request.toUser.username}
                  imageUrl={request.toUser.imageUrl}
                  role={request.toUser.role}
                  meta={
                    <>
                      <MetaLine className="mt-1.5">
                        <KindBadge kind={request.kind} />
                        <span>{timeAgo(request.createdAt)}</span>
                      </MetaLine>
                      <p className="text-app-ink mt-2 text-sm">
                        <Link
                          href={`/projects/${request.project.id}`}
                          className="font-semibold underline underline-offset-2"
                        >
                          {request.project.name}
                        </Link>
                      </p>
                      <p className="border-app-divider text-app-body mt-2 line-clamp-2 max-w-3xl border-l-2 pl-3 text-sm leading-5">
                        {request.message}
                      </p>
                    </>
                  }
                />
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <StatusBadge status={request.status} />
                  {request.status === "PENDING" ? <CancelRequest requestId={request.id} /> : null}
                </div>
              </DataRow>
            ))}
          </DataList>
        ) : (
          <EmptyState
            fill
            eyebrow="Nothing sent"
            title="No sent requests yet."
            description="Requests you send will appear here."
            action={
              <div className="flex flex-wrap gap-3">
                <AppButton asChild>
                  <Link href="/partners">Find a partner</Link>
                </AppButton>
                <AppButton asChild variant="secondary">
                  <Link href="/projects">View projects</Link>
                </AppButton>
              </div>
            }
          />
        )}
      </div>
    </>
  );
}
