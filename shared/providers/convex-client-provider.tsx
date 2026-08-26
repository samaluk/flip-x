"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { SessionId } from "convex-helpers/server/sessions";
import { SessionProvider } from "convex-helpers/react/sessions";
import { type ReactNode } from "react";

// oxlint-disable-next-line typescript/no-non-null-assertion
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const FLIP_X_SESSION_STORAGE_KEY = "flip-x.anonymous-session-id";

function generateFlipXSessionId(): SessionId {
  const existing = window.localStorage.getItem(FLIP_X_SESSION_STORAGE_KEY);
  if (existing) {
    // oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion -- SessionId is a string brand; value comes from our own localStorage key
    return existing as SessionId;
  }

  // oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion -- SessionId is a string brand; crypto.randomUUID() returns a valid opaque id
  const id = crypto.randomUUID() as SessionId;
  window.localStorage.setItem(FLIP_X_SESSION_STORAGE_KEY, id);
  return id;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <SessionProvider
        ssrFriendly
        idGenerator={generateFlipXSessionId}
        storageKey={FLIP_X_SESSION_STORAGE_KEY}
      >
        {children}
      </SessionProvider>
    </ConvexProvider>
  );
}
