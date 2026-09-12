import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/contact(.*)",
  "/support(.*)",
  "/newsletter(.*)",
  "/b(.*)",
  "/u(.*)",
  "/@(.*)",
  "/api/webhooks/clerk",
  "/api/webhooks/github",
  "/api/inngest(.*)",
  "/api/admin/ops",
  "/api/newsletter/unsubscribe",
  "/api/email/opt-out",
  "/api/cron(.*)",
  "/email(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
