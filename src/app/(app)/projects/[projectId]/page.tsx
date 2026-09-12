import Link from "next/link";
import { ProjectRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { Chip, EmptyState, MetaLine, ProgressBar, UserRow } from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch } from "@/lib/match";
import { requireProjectMember } from "@/lib/project-access";
import { attestationCountFor, evaluateContribution, isProjectVerified } from "@/lib/proof";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";
import { PartnerRequestDialog } from "../../partners/partner-request-dialog";
import { ProjectCompletionPanel } from "../project-completion-panel";
import { ProjectManagePanel } from "../project-manage-panel";
import { PublishPanel } from "../publish-panel";
import { RemoveMemberButton } from "../remove-member-button";
import { SignaturePanel } from "../signature-panel";
import { UpdateForm } from "../update-form";
import { ProjectAiPanel } from "../project-ai-panel";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatDate(date: Date | null): string {
  if (!date) {
    return "Not finished";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStamp(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function asLanguageMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
    if (typeof count === "number") out[key] = count;
  }
  return out;
}

function asModules(value: unknown): Array<{ path: string; role: string; language: string | null }> {
  if (!Array.isArray(value)) return [];
  const modules: Array<{ path: string; role: string; language: string | null }> = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const item = row as { path?: unknown; role?: unknown; language?: unknown };
    if (typeof item.path !== "string" || typeof item.role !== "string") continue;
    modules.push({
      path: item.path,
      role: item.role,
      language: typeof item.language === "string" ? item.language : null,
    });
  }
  return modules;
}

export const maxDuration = 60;

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [{ projectId }, user] = await Promise.all([params, requireOnboardedUser()]);
  const project = await requireProjectMember(projectId, user.id);
  const isOwner = project.membership.role === ProjectRole.OWNER;
  const isCompleted = project.status === "COMPLETED";
  const canInvite = !isCompleted && !user.profilePrivate;

  const [members, updates, signatures, authorUpdates, pendingInvites, candidatePool] =
    await Promise.all([
      prisma.projectMember.findMany({
        where: { projectId: project.id },
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              imageUrl: true,
              role: true,
            },
          },
        },
      }),
      prisma.projectUpdate.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          body: true,
          progress: true,
          createdAt: true,
          author: {
            select: {
              fullName: true,
              username: true,
              imageUrl: true,
              role: true,
            },
          },
        },
      }),
      prisma.proofSignature.findMany({
        where: { projectId: project.id },
        select: {
          id: true,
          signerId: true,
          subjectId: true,
          revokedAt: true,
          createdAt: true,
          signer: { select: { fullName: true, username: true } },
          subject: { select: { fullName: true, username: true } },
        },
      }),
      prisma.projectUpdate.findMany({
        where: { projectId: project.id },
        select: { authorId: true, body: true, createdAt: true },
      }),
      prisma.projectRequest.findMany({
        where: {
          projectId: project.id,
          status: "PENDING",
          kind: "INVITE",
        },
        select: {
          id: true,
          toUser: {
            select: { id: true, fullName: true, username: true, imageUrl: true, role: true },
          },
        },
      }),
      canInvite
        ? prisma.user.findMany({
            where: {
              onboarded: true,
              profilePrivate: false,
              id: { not: user.id },
            },
            orderBy: { updatedAt: "desc" },
            take: 40,
            select: {
              id: true,
              fullName: true,
              username: true,
              imageUrl: true,
              role: true,
              skills: true,
              interests: true,
            },
          })
        : Promise.resolve([]),
    ]);

  const [linkedRepo, linkableRepos, hintSessions, documentDrafts] = await Promise.all([
    prisma.githubRepository.findUnique({
      where: { projectId: project.id },
      include: {
        architecture: true,
        commitReviews: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, sha: true, title: true, createdAt: true },
        },
      },
    }),
    prisma.githubRepository.findMany({
      where: {
        installation: { userId: user.id },
        OR: [{ projectId: null }, { projectId: project.id }],
      },
      select: { id: true, owner: true, name: true, private: true },
      orderBy: [{ owner: "asc" }, { name: "asc" }],
    }),
    prisma.aiHintSession.findMany({
      where: { projectId: project.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, prompt: true, ladderStep: true, createdAt: true, response: true },
    }),
    prisma.aiDocumentDraft.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, kind: true, title: true, body: true, createdAt: true },
    }),
  ]);

  const memberIds = new Set(members.map((member) => member.user.id));
  const pendingInviteIds = new Set(pendingInvites.map((invite) => invite.toUser.id));
  const roster = [...members].sort((a, b) => {
    if (a.role === b.role) return a.joinedAt.getTime() - b.joinedAt.getTime();
    return a.role === ProjectRole.OWNER ? -1 : 1;
  });

  const memberIdList = members.map((member) => member.user.id);
  const verified = isProjectVerified(memberIdList, signatures);
  const attestedMembers = memberIdList.filter(
    (id) => attestationCountFor(id, signatures) > 0,
  ).length;

  const updatesByAuthor = new Map<string, { body: string; createdAt: Date }[]>();
  for (const update of authorUpdates) {
    const list = updatesByAuthor.get(update.authorId) ?? [];
    list.push({ body: update.body, createdAt: update.createdAt });
    updatesByAuthor.set(update.authorId, list);
  }

  const teammates = members
    .filter((member) => member.user.id !== user.id)
    .map((member) => {
      const subjectId = member.user.id;
      const name = displayName(member.user.fullName, member.user.username);
      const mySignature = signatures.find(
        (signature) =>
          signature.signerId === user.id &&
          signature.subjectId === subjectId &&
          !signature.revokedAt,
      );
      const contribution = evaluateContribution(updatesByAuthor.get(subjectId) ?? []);
      return {
        id: subjectId,
        name,
        canSign: contribution.ok && !mySignature,
        alreadySigned: Boolean(mySignature),
        signatureId: mySignature?.id ?? null,
        reason: contribution.ok ? undefined : (contribution.reason ?? "Not ready to sign."),
      };
    });

  const inviteSuggestions = candidatePool
    .filter((candidate) => !memberIds.has(candidate.id) && !pendingInviteIds.has(candidate.id))
    .map((candidate) => ({
      candidate,
      breakdown: scoreMatch(user, candidate),
    }))
    .sort((a, b) => b.breakdown.score - a.breakdown.score)
    .slice(0, 3);

  const fixedProject = { id: project.id, name: project.name };
  const soloSelfAttested = memberIdList.length === 1 && memberIdList[0] === user.id;
  const isPublic = project.visibility === "PUBLIC";
  const canPublish = isOwner && isCompleted && isPublic && (verified || soloSelfAttested);
  const publishBlockReason = !isOwner
    ? null
    : !isCompleted
      ? "Mark the project complete before publishing."
      : !isPublic
        ? "Switch visibility to public before publishing."
        : !(verified || soloSelfAttested)
          ? "Get peer signatures from every teammate, or keep this as a solo build."
          : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="border-app-divider bg-app-paper border">
        <div className="border-app-divider flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2">
          <AppButton asChild variant="ghost" size="sm">
            <Link href="/projects">
              <ArrowLeft size={14} strokeWidth={2} aria-hidden />
              Projects
            </Link>
          </AppButton>
          <div className="flex flex-wrap gap-1.5">
            <Chip>{project.visibility.toLowerCase()}</Chip>
            <Chip tone={isCompleted ? "ink" : "wash"}>{project.status.toLowerCase()}</Chip>
            {verified ? <Chip tone="ink">verified</Chip> : null}
            {project.publishedAt ? <Chip tone="ink">published</Chip> : null}
          </div>
        </div>
        <div className="px-4 py-4">
          <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
            Project workspace
          </p>
          <h1 className="text-app-ink mt-1 text-[1.75rem] leading-tight font-medium sm:text-[2rem]">
            {project.name}
          </h1>
          <p className="text-app-body mt-2 max-w-4xl text-sm leading-6">{project.description}</p>
          <MetaLine className="mt-3">
            <span>{project.estimatedTime || "No estimate"}</span>
            <span aria-hidden>·</span>
            <span>
              {isCompleted ? `Finished ${formatDate(project.completedAt)}` : "In progress"}
            </span>
            <span aria-hidden>·</span>
            <span>{isOwner ? "Owner" : "Member"}</span>
            <span aria-hidden>·</span>
            <span>
              {members.length} member{members.length === 1 ? "" : "s"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {authorUpdates.length} update{authorUpdates.length === 1 ? "" : "s"}
            </span>
          </MetaLine>
          {!isCompleted ? (
            <div className="mt-4 max-w-md">
              <ProgressBar value={project.progress} />
            </div>
          ) : null}
          {project.techStack.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.techStack.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          ) : null}
        </div>
        <nav
          aria-label="Project sections"
          className="border-app-divider flex flex-wrap gap-1 border-t px-4 py-2"
        >
          <AppButton asChild variant="ghost" size="sm">
            <a href="#hackollab-ai">Hackollab AI</a>
          </AppButton>
          <AppButton asChild variant="ghost" size="sm">
            <a href="#build-log">Build log</a>
          </AppButton>
          <AppButton asChild variant="ghost" size="sm">
            <a href="#roster">Roster</a>
          </AppButton>
          <AppButton asChild variant="ghost" size="sm">
            <a href="#verification">Verification</a>
          </AppButton>
          <AppButton asChild variant="ghost" size="sm">
            <a href="#project-settings">Settings</a>
          </AppButton>
        </nav>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <UpdateForm projectId={project.id} progress={project.progress} disabled={isCompleted} />

          <ProjectAiPanel
            projectId={project.id}
            linked={
              linkedRepo
                ? {
                    id: linkedRepo.id,
                    owner: linkedRepo.owner,
                    name: linkedRepo.name,
                    private: linkedRepo.private,
                    defaultBranch: linkedRepo.defaultBranch,
                    lastSyncedAt: linkedRepo.lastSyncedAt?.toISOString() ?? null,
                    summary: linkedRepo.architecture?.summary ?? null,
                    languages: asLanguageMap(linkedRepo.architecture?.languages),
                    modules: asModules(linkedRepo.architecture?.modules),
                  }
                : null
            }
            linkable={linkableRepos}
            reviews={(linkedRepo?.commitReviews ?? []).map((review) => ({
              id: review.id,
              sha: review.sha,
              title: review.title,
              createdAt: review.createdAt.toISOString(),
            }))}
            hints={hintSessions.map((hint) => ({
              ...hint,
              createdAt: hint.createdAt.toISOString(),
            }))}
            drafts={documentDrafts.map((draft) => ({
              ...draft,
              createdAt: draft.createdAt.toISOString(),
            }))}
          />

          <section id="build-log" className="border-app-divider bg-app-paper scroll-mt-20 border">
            <div className="border-app-divider flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
                  Activity
                </p>
                <h2 className="text-app-ink mt-1 text-lg font-semibold">Build log</h2>
              </div>
              <span className="text-app-meta text-sm tabular-nums">{authorUpdates.length}</span>
            </div>
            {updates.length ? (
              <ul className="divide-app-divider divide-y">
                {updates.map((update) => (
                  <li key={update.id} className="px-4 py-2.5">
                    <UserRow
                      fullName={update.author.fullName}
                      username={update.author.username}
                      imageUrl={update.author.imageUrl}
                      role={update.author.role}
                      meta={
                        <>
                          <p className="text-app-meta mt-1 text-xs">
                            {formatStamp(update.createdAt)}
                          </p>
                          <p className="text-app-body mt-3 max-w-3xl text-sm leading-6">
                            {update.body}
                          </p>
                          {update.progress !== null ? (
                            <MetaLine className="mt-3">
                              <span>Progress updated to {update.progress}%</span>
                            </MetaLine>
                          ) : null}
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState variant="inline" eyebrow="Quiet" title="No updates yet." />
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div id="verification" className="scroll-mt-20">
            <SignaturePanel
              projectId={project.id}
              verified={verified}
              teammates={teammates}
              signaturesReceived={attestedMembers}
              memberCount={memberIdList.length}
            />
          </div>

          {isOwner ? (
            <PublishPanel
              projectId={project.id}
              published={Boolean(project.publishedAt)}
              slug={project.slug}
              summary={project.summary}
              canPublish={canPublish}
              blockReason={publishBlockReason}
            />
          ) : null}

          <section id="roster" className="border-app-divider bg-app-paper scroll-mt-20 border">
            <div className="border-app-divider border-b px-4 py-2.5">
              <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
                Roster
              </p>
            </div>
            <ul className="divide-app-divider divide-y">
              {roster.map((member) => {
                const attestations = attestationCountFor(member.user.id, signatures);
                const canRemove =
                  isOwner &&
                  !isCompleted &&
                  member.role !== ProjectRole.OWNER &&
                  member.user.id !== user.id;
                return (
                  <li key={member.id} className="px-4 py-2.5">
                    <UserRow
                      fullName={member.user.fullName}
                      username={member.user.username}
                      imageUrl={member.user.imageUrl}
                      role={member.user.role}
                      meta={
                        <p className="text-app-meta text-chip tracking-meta mt-1 font-mono uppercase">
                          {member.role === ProjectRole.OWNER ? "Owner" : "Member"} · joined{" "}
                          {formatDate(member.joinedAt)}
                          {attestations > 0
                            ? ` · ${attestations} signature${attestations === 1 ? "" : "s"}`
                            : ""}
                        </p>
                      }
                    />
                    {canRemove ? (
                      <RemoveMemberButton
                        projectId={project.id}
                        memberUserId={member.user.id}
                        memberName={displayName(member.user.fullName, member.user.username)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          {pendingInvites.length ? (
            <section className="border-app-divider bg-app-paper border">
              <div className="border-app-divider border-b px-4 py-2.5">
                <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
                  Pending invites
                </p>
              </div>
              <ul className="divide-app-divider divide-y">
                {pendingInvites.map((invite) => (
                  <li key={invite.id} className="px-4 py-2.5">
                    <UserRow
                      fullName={invite.toUser.fullName}
                      username={invite.toUser.username}
                      imageUrl={invite.toUser.imageUrl}
                      role={invite.toUser.role}
                      meta={
                        <p className="text-app-meta text-chip tracking-meta mt-1 font-mono uppercase">
                          Waiting on reply
                        </p>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canInvite ? (
            <section className="border-app-divider bg-app-paper border">
              <div className="border-app-divider border-b px-4 py-2.5">
                <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
                  Invite
                </p>
              </div>
              {inviteSuggestions.length ? (
                <ul className="divide-app-divider divide-y">
                  {inviteSuggestions.map(({ candidate, breakdown }) => (
                    <li key={candidate.id} className="space-y-3 px-4 py-2.5">
                      <UserRow
                        fullName={candidate.fullName}
                        username={candidate.username}
                        imageUrl={candidate.imageUrl}
                        role={candidate.role}
                        meta={
                          breakdown.sharedSkills.length || breakdown.sharedInterests.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {[...breakdown.sharedSkills, ...breakdown.sharedInterests]
                                .slice(0, 3)
                                .map((tag) => (
                                  <Chip key={tag} tone="ink">
                                    {tag}
                                  </Chip>
                                ))}
                            </div>
                          ) : null
                        }
                      />
                      <PartnerRequestDialog
                        toUserId={candidate.id}
                        toName={displayName(candidate.fullName, candidate.username)}
                        sharedSkills={breakdown.sharedSkills}
                        sharedInterests={breakdown.sharedInterests}
                        projects={[fixedProject]}
                        fixedProject={fixedProject}
                        triggerLabel="Invite"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  variant="inline"
                  eyebrow="Empty pool"
                  title="No open builders to invite yet."
                />
              )}
              <div className="border-app-divider border-t px-4 py-2.5">
                <Link
                  href="/partners"
                  className="text-app-ink text-sm font-medium underline underline-offset-2"
                >
                  Browse partners
                </Link>
              </div>
            </section>
          ) : null}

          {isOwner ? (
            <ProjectCompletionPanel projectId={project.id} disabled={isCompleted} />
          ) : null}

          <div id="project-settings" className="scroll-mt-20">
            <ProjectManagePanel
              projectId={project.id}
              isOwner={isOwner}
              isCompleted={isCompleted}
              name={project.name}
              description={project.description}
              techStack={project.techStack}
              estimatedTime={project.estimatedTime}
              visibility={project.visibility}
              members={members.map((member) => ({
                userId: member.user.id,
                name: displayName(member.user.fullName, member.user.username),
                role: member.role,
              }))}
            />
          </div>
        </aside>
      </section>
    </div>
  );
}
