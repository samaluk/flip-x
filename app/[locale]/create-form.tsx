import type { FormEvent } from "react";

import { Button } from "@/shared/ui/button";

export interface CreateFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOpenJoinFlow: () => void;
  disabled: boolean;
  createButtonLabel: string;
  dividerLabel: string;
  joinButtonLabel: string;
}

export function CreateForm({
  onSubmit,
  onOpenJoinFlow,
  disabled,
  createButtonLabel,
  dividerLabel,
  joinButtonLabel,
}: CreateFormProps) {
  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit}>
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-medium"
          disabled={disabled}
        >
          {createButtonLabel}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{dividerLabel}</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="h-12 w-full text-base"
        onClick={onOpenJoinFlow}
      >
        {joinButtonLabel}
      </Button>
    </div>
  );
}
