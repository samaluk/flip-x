"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "flip7.anonymous-session-id";

function createSessionId() {
  return crypto.randomUUID();
}

function readStoredSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const nextValue = createSessionId();
  window.localStorage.setItem(STORAGE_KEY, nextValue);
  return nextValue;
}

export function useAnonymousSessionId() {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(readStoredSessionId());
  }, []);

  return sessionId;
}
