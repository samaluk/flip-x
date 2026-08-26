"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { SessionId } from "convex-helpers/server/sessions";
import { SessionProvider } from "convex-helpers/react/sessions";
import { useState, type ReactNode } from "react";

// oxlint-disable-next-line typescript/no-non-null-assertion
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useLocalSessionStorage(key: string, initialValue: SessionId | undefined) {
  const [value, setValue] = useState<SessionId | undefined>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    const existing = window.localStorage.getItem(key);
    if (existing) {
      // oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion -- SessionId is a string brand; value comes from our own localStorage key
      return existing as SessionId;
    }

    if (initialValue !== undefined) {
      window.localStorage.setItem(key, initialValue);
    }

    return initialValue;
  });

  const updateValue = (nextValue: SessionId | undefined) => {
    if (nextValue === undefined) {
      window.localStorage.removeItem(key);
      setValue(undefined);
      return;
    }

    window.localStorage.setItem(key, nextValue);
    setValue(nextValue);
  };

  return [value, updateValue] as const;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {/* why: `SessionProvider.useStorage` intentionally accepts a hook as a value — the library calls it internally. The React Compiler's `react/hooks` rule treats any hook-as-value as a Rules-of-Hooks violation; narrow suppress here preserves the intended API while keeping the compiler check for all other code. */}
      {/* oxlint-disable react/hooks -- `useLocalSessionStorage` is a storage hook passed to `SessionProvider`; the library invokes it internally per its `UseStorage` contract */}
      <SessionProvider
        ssrFriendly
        useStorage={useLocalSessionStorage}
        storageKey="flip-x.anonymous-session-id"
      >
        {children}
      </SessionProvider>
      {/* oxlint-enable react/hooks */}
    </ConvexProvider>
  );
}
