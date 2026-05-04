import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${String(value)}`);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
