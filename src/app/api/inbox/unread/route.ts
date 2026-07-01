import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({ count });
}
