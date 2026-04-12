"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { SessionId } from "convex-helpers/server/sessions";
import { SessionProvider } from "convex-helpers/react/sessions";
import { useState, type ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useLocalSessionStorage(key: string, initialValue: SessionId | undefined) {
  const [value, setValue] = useState<SessionId | undefined>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    const existing = window.localStorage.getItem(key);
    if (existing) {
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
      <SessionProvider useStorage={useLocalSessionStorage} storageKey="flip7.anonymous-session-id">
        {children}
      </SessionProvider>
    </ConvexProvider>
  );
}
