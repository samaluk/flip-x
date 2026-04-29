import { MatchSnapshot as MatchSnapshotSchema } from "@/confect/match-snapshot-schema";

export type ConfectMatchSnapshot = (typeof MatchSnapshotSchema)["Type"];
