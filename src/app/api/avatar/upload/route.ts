import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Client-side uploads hand the browser a short-lived, scoped token instead of
// streaming the file through our server, which keeps avatars off the serverless
// request body limit while still gating who can upload and what they can send.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 4 * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      // We persist the final URL from the client via setAvatar once upload
      // resolves, so this webhook stays a no-op (and works on localhost too).
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
