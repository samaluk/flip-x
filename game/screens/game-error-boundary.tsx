"use client";

import { catchError, type ErrorInfo } from "next/error";
import { useParams } from "next/navigation";

import { GameErrorContent } from "@/game/screens/game-error-content";

function toDisplayError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function GameErrorFallbackWithParams({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ locale: string; matchId: string }>();
  const displayError = toDisplayError(error);

  return (
    <GameErrorContent
      error={displayError}
      retry={retry}
      locale={params.locale}
      matchId={params.matchId}
    />
  );
}

function GameErrorFallback(_props: object, { error, retry }: ErrorInfo) {
  return <GameErrorFallbackWithParams error={error} retry={retry} />;
}

export const GameErrorBoundary = catchError(GameErrorFallback);
