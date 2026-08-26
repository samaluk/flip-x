import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";

import type { useRouter } from "@/shared/i18n/navigation";

export function gameMatchPath(matchId: string) {
  return `/game/${matchId}`;
}

/**
 * Prefetch the game route's App Shell plus URL params, then navigate.
 *
 * Under Partial Prefetching, `kind: "full"` matches `<Link prefetch={true}>`:
 * resolve `[matchId]` for this destination without prefetching live Convex data.
 */
export function prefetchAndPushGameMatch(
  router: Pick<ReturnType<typeof useRouter>, "prefetch" | "push">,
  matchId: string,
) {
  const href = gameMatchPath(matchId);
  router.prefetch(href, { kind: PrefetchKind.FULL });
  router.push(href);
}
