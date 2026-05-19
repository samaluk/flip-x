import { postHogMiddleware } from "@posthog/next";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "./shared/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const posthogProxyMiddleware = postHogMiddleware({ proxy: true });

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/ingest")) {
    return posthogProxyMiddleware(request as never);
  }

  const response = intlMiddleware(request as never);
  return postHogMiddleware({ response: response as never })(request as never);
}

export const config = {
  matcher: ["/ingest/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
