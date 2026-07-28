import Link from "next/link";
import { ProjectRole } from "@prisma/client";
import { Chip, PageHeader, UserRow } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { scoreMatch } from "@/lib/match";
import { requireProjectMember } from "@/lib/project-access";
import {
  attestationCountFor,
  isProjectVerified,
  SYSTEM_UPDATE_BODIES,
} from "@/lib/proof";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user-display";
import { PartnerRequestDialog } from "../../partners/partner-request-dialog";
import { ProjectCompletionPanel } from "../project-completion-panel";
import { PublishPanel } from "../publish-panel";
import { SignaturePanel } from "../signature-panel";
import { UpdateForm } from "../update-form";

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

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [{ projectId }, user] = await Promise.all([params, requireOnboardedUser()]);
  const project = await requireProjectMember(projectId, user.id);
  const isOwner = project.membership.role === ProjectRole.OWNER;
  const isCompleted = project.status === "COMPLETED";
  const canInvite = !isCompleted && !user.profilePrivate;

  const [members, updates, signatures, activeAuthors, pendingInvites, candidatePool] =
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
      where: {
        projectId: project.id,
        NOT: { body: { in: [...SYSTEM_UPDATE_BODIES] } },
      },
      distinct: ["authorId"],
      select: { authorId: true },
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

  const activityByAuthor = new Set(activeAuthors.map((row) => row.authorId));

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
      const hasActivity = activityByAuthor.has(subjectId);
      return {
        id: subjectId,
        name,
        canSign: hasActivity && !mySignature,
        alreadySigned: Boolean(mySignature),
        signatureId: mySignature?.id ?? null,
        reason: hasActivity
          ? undefined
          : "Waiting for them to post a real build-log update.",
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
  const canPublish =
    isOwner && isCompleted && isPublic && (verified || soloSelfAttested);
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
    <div className="flex flex-col gap-8">
      <div>
        <Button
          asChild
          variant="secondary"
          className="border-app-divider bg-app-paper text-app-ink hover:bg-app-chip rounded-full border px-5"
        >
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Shared build"
        title={project.name}
        description={project.description}
        aside={
          <>
            <p className="text-app-label text-eyebrow font-semibold tracking-eyebrow uppercase">
              Status
            </p>
            <p className="text-app-ink mt-4 font-serif text-5xl font-light">{project.progress}%</p>
            <div className="bg-app-divider mt-5 h-2">
              <div className="bg-app-ink h-full" style={{ width: `${project.progress}%` }} />
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <Chip>{project.visibility.toLowerCase()}</Chip>
              <Chip tone={isCompleted ? "ink" : "wash"}>{project.status.toLowerCase()}</Chip>
              {verified ? <Chip tone="ink">verified</Chip> : null}
              {project.publishedAt ? <Chip tone="ink">published</Chip> : null}
            </div>
            <dl className="text-app-body mt-8 grid gap-4 text-sm">
              <div>
                <dt className="text-app-label text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Estimated time
                </dt>
                <dd className="mt-1">{project.estimatedTime || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-app-label text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Finished
                </dt>
                <dd className="mt-1">{formatDate(project.completedAt)}</dd>
              </div>
              <div>
                <dt className="text-app-label text-[10px] font-semibold tracking-[0.16em] uppercase">
                  On the roster
                </dt>
                <dd className="mt-1">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </dd>
              </div>
            </dl>
          </>
        }
      >
        {project.techStack.length ? (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {project.techStack.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        ) : null}
      </PageHeader>

      <section className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <UpdateForm projectId={project.id} progress={project.progress} disabled={isCompleted} />

          <section className="border-app-divider bg-app-paper border">
            <div className="border-app-divider border-b px-6 py-5">
              <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
                Build log
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light">What the team posted</h2>
            </div>
            {updates.length ? (
              <ul className="divide-app-divider divide-y">
                {updates.map((update) => (
                  <li key={update.id} className="px-6 py-5">
                    <UserRow
                      fullName={update.author.fullName}
                      username={update.author.username}
                      imageUrl={update.author.imageUrl}
                      role={update.author.role}
                      meta={
                        <>
                          <p className="text-app-meta mt-1 text-xs">{formatStamp(update.createdAt)}</p>
                          <p className="text-app-body mt-3 max-w-3xl text-body leading-6">
                            {update.body}
                          </p>
                          {update.progress !== null ? (
                            <p className="text-app-label mt-3 font-mono text-chip tracking-meta uppercase">
                              Progress → {update.progress}%
                            </p>
                          ) : null}
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-app-body px-6 py-8 text-body-sm leading-6">
                No updates yet. Post the first one above.
              </p>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <SignaturePanel
            projectId={project.id}
            verified={verified}
            teammates={teammates}
            signaturesReceived={attestedMembers}
            memberCount={memberIdList.length}
          />

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

          <section className="border-app-divider bg-app-paper border">
            <div className="border-app-divider border-b px-5 py-4">
              <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
                Roster
              </p>
              <p className="text-app-body mt-2 text-body-sm leading-5">
                Everyone with a seat on this build.
              </p>
            </div>
            <ul className="divide-app-divider divide-y">
              {roster.map((member) => {
                const attestations = attestationCountFor(member.user.id, signatures);
                return (
                <li key={member.id} className="px-5 py-4">
                  <UserRow
                    fullName={member.user.fullName}
                    username={member.user.username}
                    imageUrl={member.user.imageUrl}
                    role={member.user.role}
                    meta={
                      <p className="text-app-meta mt-1 font-mono text-chip tracking-meta uppercase">
                        {member.role === ProjectRole.OWNER ? "Owner" : "Member"} · joined{" "}
                        {formatDate(member.joinedAt)}
                        {attestations > 0
                          ? ` · ${attestations} signature${attestations === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    }
                  />
                </li>
                );
              })}
            </ul>
          </section>

          {pendingInvites.length ? (
            <section className="border-app-divider bg-app-paper border">
              <div className="border-app-divider border-b px-5 py-4">
                <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
                  Pending invites
                </p>
              </div>
              <ul className="divide-app-divider divide-y">
                {pendingInvites.map((invite) => (
                  <li key={invite.id} className="px-5 py-4">
                    <UserRow
                      fullName={invite.toUser.fullName}
                      username={invite.toUser.username}
                      imageUrl={invite.toUser.imageUrl}
                      role={invite.toUser.role}
                      meta={
                        <p className="text-app-meta mt-1 font-mono text-chip tracking-meta uppercase">
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
              <div className="border-app-divider border-b px-5 py-4">
                <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
                  Invite
                </p>
                <p className="text-app-body mt-2 text-body-sm leading-5">
                  Pull in the missing role for this build.
                </p>
              </div>
              {inviteSuggestions.length ? (
                <ul className="divide-app-divider divide-y">
                  {inviteSuggestions.map(({ candidate, breakdown }) => (
                    <li key={candidate.id} className="space-y-3 px-5 py-4">
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
                <p className="text-app-body px-5 py-5 text-body-sm leading-6">
                  No open builders to invite yet.{" "}
                  <Link href="/partners" className="border-app-ink border-b pb-0.5">
                    Browse partners
                  </Link>
                </p>
              )}
              <div className="border-app-divider border-t px-5 py-4">
                <Link
                  href="/partners"
                  className="text-app-ink text-sm font-medium underline underline-offset-2"
                >
                  Open full directory
                </Link>
              </div>
            </section>
          ) : null}

          {isOwner ? <ProjectCompletionPanel projectId={project.id} disabled={isCompleted} /> : null}
        </aside>
      </section>
    </div>
  );
}
