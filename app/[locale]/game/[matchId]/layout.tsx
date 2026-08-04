import type { ReactNode } from "react";

import { GameErrorBoundary } from "@/game/screens/game-error-boundary";

export default function GameMatchLayout({ children }: { children: ReactNode }) {
  return <GameErrorBoundary>{children}</GameErrorBoundary>;
}
