import Link from "next/link";
import { requireOnboardedUser } from "@/lib/current-user";
import { requireForumBoard } from "@/lib/forum-server";
import { memberProjectWhere } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { BoardStrip, ForumSubnav } from "../../forum-chrome";
import { ThreadForm } from "../../thread-form";

export default async function NewThreadPage({ params }: { params: Promise<{ board: string }> }) {
  const viewer = await requireOnboardedUser();
  const { board: boardSlug } = await params;
  const board = await requireForumBoard(boardSlug);
  const projects = await prisma.project.findMany({
    where: { ...memberProjectWhere(viewer.id), status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <ForumSubnav active="threads" />
      <BoardStrip activeSlug={board.slug} />
      <div>
        <p className="text-app-meta text-[13px] font-semibold tracking-[0.1em] uppercase">
          New thread
        </p>
        <h1 className="text-app-ink mt-1 text-[1.75rem] leading-tight font-bold">{board.title}</h1>
        <p className="text-app-meta mt-1 text-sm">{board.description}</p>
        <Link
          href={`/forum/${board.slug}`}
          className="text-app-ink mt-2 inline-block text-sm font-semibold underline underline-offset-2"
        >
          Back to {board.title}
        </Link>
      </div>
      <ThreadForm boardSlug={board.slug} projects={projects} />
    </div>
  );
}
