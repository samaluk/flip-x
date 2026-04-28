import { Data } from "effect";

export class ExternalComponentFailed extends Data.TaggedError("ExternalComponentFailed")<{
  component: string;
  cause: unknown;
}> {}
