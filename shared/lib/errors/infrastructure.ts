import { Data } from "effect";

export class DatabaseReadFailed extends Data.TaggedError("DatabaseReadFailed")<{
  cause: unknown;
}> {}

export class DatabaseWriteFailed extends Data.TaggedError("DatabaseWriteFailed")<{
  cause: unknown;
}> {}

export class ExternalComponentFailed extends Data.TaggedError("ExternalComponentFailed")<{
  component: string;
  cause: unknown;
}> {}
