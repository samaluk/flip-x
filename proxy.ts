import { postHogMiddleware } from "@posthog/next";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "./shared/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!posthogKey) {
    if (request.nextUrl.pathname.startsWith("/ingest")) {
      return new Response(null, { status: 404 });
    }

    return intlMiddleware(request as never);
  }

  if (request.nextUrl.pathname.startsWith("/ingest")) {
    return postHogMiddleware({ apiKey: posthogKey, proxy: true })(request as never);
  }

  const response = intlMiddleware(request as never);
  return postHogMiddleware({ apiKey: posthogKey, response: response as never })(request as never);
}

export const config = {
  matcher: ["/ingest/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
