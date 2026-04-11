import { cn } from "@/lib/utils";

/**
 * Scaled sidebar cards are always `w-32`; viewport `sm:` would overflow the aspect box and clip.
 * When `compact`, keep only the base (mobile) styles.
 */
export function cardTw(compact: boolean | undefined, base: string, wideScreen: string) {
  return cn(base, !compact && wideScreen);
}
