import type { Project, User } from "@prisma/client";

export type NextAction = {
  label: string;
  href: string;
  detail: string;
};

type ActionInput = {
  user: Pick<User, "bio" | "skills" | "interests">;
  activeProject: Pick<Project, "id" | "status" | "progress" | "name"> | null;
  pendingReceived: number;
  completedCount: number;
};

export function resolveNextAction({
  user,
  activeProject,
  pendingReceived,
  completedCount,
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

  if (!user.bio) {
    return {
      label: "Tighten profile signal",
      href: "/onboarding",
      detail: "Your profile needs a clear thesis before partners can trust the match.",
    };
  }

  if (!activeProject) {
    return {
      label: "Start project brief",
      href: "/projects",
      detail: "Move from profile intent into a project brief before searching for teammates.",
    };
  }

  if (activeProject.status === "ACTIVE" && activeProject.progress < 100) {
    return {
      label: "Advance active project",
      href: `/projects/${activeProject.id}`,
      detail: `${activeProject.name} is at ${activeProject.progress}%. Push the next checkpoint.`,
    };
  }

  if (activeProject.status === "ACTIVE" && activeProject.progress >= 100) {
    return {
      label: "Capture project proof",
      href: `/projects/${activeProject.id}`,
      detail: "Progress is complete. Close the loop and log the proof.",
    };
  }

  if (user.skills.length && user.interests.length) {
    return {
      label: "Find the missing role",
      href: "/partners",
      detail: "Your profile has enough signal to name the partner you still need.",
    };
  }

  if (completedCount > 0) {
    return {
      label: "Start the next build",
      href: "/projects",
      detail: "You have proof on record. Brief the next serious project.",
    };
  }

  return {
    label: "Start project brief",
    href: "/projects",
    detail: "One clear brief beats ten half-open tabs.",
  };
}
