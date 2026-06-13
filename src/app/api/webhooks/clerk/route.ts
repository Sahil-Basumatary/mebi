import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type ClerkEmailAddress = {
  email_address: string;
  id: string;
};

type ClerkUserPayload = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  username?: string | null;
};

function getPrimaryEmail(payload: ClerkUserPayload): string | null {
  const primaryId = payload.primary_email_address_id;
  if (primaryId) {
    const exactMatch = payload.email_addresses?.find((email) => email.id === primaryId);
    if (exactMatch?.email_address) {
      return exactMatch.email_address.toLowerCase();
    }
  }

  const fallbackEmail = payload.email_addresses?.[0]?.email_address;
  return fallbackEmail ? fallbackEmail.toLowerCase() : null;
}

function getFullName(payload: ClerkUserPayload): string | null {
  const first = payload.first_name?.trim() ?? "";
  const last = payload.last_name?.trim() ?? "";
  const fullName = `${first} ${last}`.trim();
  return fullName || null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET configuration" },
      { status: 500 },
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix verification headers" }, { status: 400 });
  }

  const payloadText = await request.text();
  const webhook = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = webhook.verify(payloadText, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const userPayload = event.data as ClerkUserPayload;
    const email = getPrimaryEmail(userPayload);
    if (!email) {
      return NextResponse.json({ error: "Clerk user missing primary email" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { clerkId: userPayload.id },
      update: {
        email,
        fullName: getFullName(userPayload),
        username: userPayload.username ?? null,
        imageUrl: userPayload.image_url ?? null,
      },
      create: {
        clerkId: userPayload.id,
        email,
        fullName: getFullName(userPayload),
        username: userPayload.username ?? null,
        imageUrl: userPayload.image_url ?? null,
      },
    });
  }

  if (event.type === "user.deleted") {
    const deletedId =
      typeof event.data === "object" && event.data && "id" in event.data ? event.data.id : null;
    if (typeof deletedId === "string") {
      await prisma.user.deleteMany({
        where: { clerkId: deletedId },
      });
    }
  }

  return NextResponse.json({ success: true });
}
