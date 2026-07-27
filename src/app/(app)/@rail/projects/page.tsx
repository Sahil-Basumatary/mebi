import Link from "next/link";
import { ProjectTimeline, type TimelineProject } from "@/components/three/project-timeline";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/current-user";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export default async function ProjectsRail() {
  const user = await requireOnboardedUser();
  const projects = await prisma.project.findMany({
    where: memberProjectWhere(user.id),
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, status: true, progress: true },
  });
  const timelineProjects: TimelineProject[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    progress: project.progress,
  }));

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-app-label text-meta font-semibold tracking-rail uppercase">Pipeline</p>
        <p className="text-app-body mt-3 text-body-sm leading-6">
          Each node is a project. Origin stays until your first brief lands.
        </p>
      </div>
      <div className="relative min-h-[18rem] flex-1">
        <ProjectTimeline projects={timelineProjects} className="absolute inset-0" />
      </div>
      <Button asChild className="rounded-full bg-app-ink text-app-paper hover:bg-app-accent-hover px-6">
        <Link href="/projects#new-project">Create project</Link>
      </Button>
    </div>
  );
}
