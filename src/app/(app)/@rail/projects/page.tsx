import Link from "next/link";
import { ProjectTimeline, type TimelineProject } from "@/components/three/project-timeline";
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
        <p className="text-app-label text-meta tracking-rail font-semibold uppercase">Pipeline</p>
      </div>
      <div className="relative min-h-[18rem] flex-1">
        <ProjectTimeline projects={timelineProjects} className="absolute inset-0" />
      </div>
      <nav aria-label="Projects in pipeline" className="sr-only">
        {projects.length ? (
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`}>
                  {project.name}
                  {project.status === "COMPLETED"
                    ? ", completed"
                    : `, active, ${project.progress}% built`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No projects yet. Brief your first project to grow the chain.</p>
        )}
      </nav>
    </div>
  );
}
