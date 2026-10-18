import { GroupSpec, Spec } from "@confect/core";
import admin from "../admin.spec";
import matches from "../matches.spec";
import migrations from "../migrations.spec";
import presence from "../presence.spec";
import rounds from "../rounds.spec";
import settings from "../settings.spec";
import turns from "../turns.spec";

const spec: Spec.Spec<{
  readonly admin: GroupSpec.NamedAt<typeof admin, "admin">;
  readonly matches: GroupSpec.NamedAt<typeof matches, "matches">;
  readonly migrations: GroupSpec.NamedAt<typeof migrations, "migrations">;
  readonly presence: GroupSpec.NamedAt<typeof presence, "presence">;
  readonly rounds: GroupSpec.NamedAt<typeof rounds, "rounds">;
  readonly settings: GroupSpec.NamedAt<typeof settings, "settings">;
  readonly turns: GroupSpec.NamedAt<typeof turns, "turns">;
}> = Spec.fromGroups({
  ["admin"]: admin,
  ["matches"]: matches,
  ["migrations"]: migrations,
  ["presence"]: presence,
  ["rounds"]: rounds,
  ["settings"]: settings,
  ["turns"]: turns,
}) as typeof spec;

export default spec;
