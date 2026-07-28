import type { ProjectStatus, User } from "@prisma/client";

export type NextAction = {
  label: string;
  href: string;
  detail: string;
};

export type NextActionProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  memberCount: number;
  publishedAt: Date | null;
  needsMyUpdate: boolean;
  awaitingMySignature: boolean;
  readyToPublish: boolean;
};

type ActionInput = {
  user: Pick<User, "bio" | "skills" | "interests" | "prefersSolo">;
  activeProject: NextActionProject | null;
  pendingReceived: number;
  publishedCount: number;
};

export function resolveNextAction({
  user,
  activeProject,
  pendingReceived,
  publishedCount,
}: ActionInput): NextAction {
  if (pendingReceived > 0) {
    return {
      label: "Respond to requests",
      href: "/inbox",
      detail:
        pendingReceived === 1
          ? "One build request is waiting on you."
          : `${pendingReceived} build requests are waiting on you.`,
    };
  }

  if (!user.bio || user.skills.length === 0) {
    return {
      label: "Tighten profile signal",
      href: "/onboarding",
      detail: "Partners need a clear thesis and skills before they will join a build.",
    };
  }

  if (!activeProject) {
    return {
      label: "Start a build",
      href: "/projects",
      detail: "Open a project brief so there is something real to invite people into.",
    };
  }

  if (activeProject.status === "ACTIVE") {
    if (activeProject.memberCount < 2 && !user.prefersSolo) {
      return {
        label: "Invite a builder",
        href: "/partners",
        detail: `${activeProject.name} still needs a teammate who will ship and sign.`,
      };
    }

    if (activeProject.needsMyUpdate) {
      return {
        label: "Post a build update",
        href: `/projects/${activeProject.id}`,
        detail: `Leave a real note on ${activeProject.name} so teammates can attest your work.`,
      };
    }

    if (activeProject.awaitingMySignature) {
      return {
        label: "Sign a teammate",
        href: `/projects/${activeProject.id}`,
        detail: "Someone on this build has logged work and is waiting on your signature.",
      };
    }

    if (activeProject.progress >= 100) {
      return {
        label: "Mark the build complete",
        href: `/projects/${activeProject.id}`,
        detail: "Progress is full. Close the loop so publishing unlocks.",
      };
    }

    return {
      label: "Keep building",
      href: `/projects/${activeProject.id}`,
      detail: `${activeProject.name} is live. Post the next update in the shared log.`,
    };
  }

  if (activeProject.readyToPublish) {
    return {
      label: "Publish proof",
      href: `/projects/${activeProject.id}`,
      detail: "This build is finished and attested. Put the public proof page live.",
    };
  }

  if (publishedCount > 0) {
    return {
      label: "Start the next build",
      href: "/projects",
      detail: "You have published proof. Brief the next serious project.",
    };
  }

  return {
    label: "Open your builds",
    href: "/projects",
    detail: "Finish signatures and publishing so proof becomes something you can share.",
  };
}
