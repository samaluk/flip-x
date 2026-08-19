import type { FormEvent } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export interface JoinFormProps {
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  disabled: boolean;
  lobbyCodeLabel: string;
  codePlaceholder: string;
  cancelLabel: string;
  joinButtonLabel: string;
}

export function JoinForm({
  joinCode,
  onJoinCodeChange,
  onSubmit,
  onCancel,
  disabled,
  lobbyCodeLabel,
  codePlaceholder,
  cancelLabel,
  joinButtonLabel,
}: JoinFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="joinCode" className="text-sm font-medium text-foreground">
          {lobbyCodeLabel}
        </label>
        <Input
          id="joinCode"
          value={joinCode}
          onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
          placeholder={codePlaceholder}
          maxLength={4}
          className="h-12 text-center font-mono text-2xl tracking-widest uppercase"
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-1"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          size="lg"
          className="h-12 flex-1 text-base font-medium"
          disabled={disabled}
        >
          {joinButtonLabel}
        </Button>
      </div>
    </form>
  );
}
