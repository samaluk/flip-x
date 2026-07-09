import { GroupSpec, Spec } from "@confect/core";
import admin from "../admin.spec";
import matches from "../matches.spec";
import migrations from "../migrations.spec";
import presence from "../presence.spec";
import rounds from "../rounds.spec";
import settings from "../settings.spec";
import turns from "../turns.spec";

const spec: Spec.Spec<
  | GroupSpec.NamedAt<typeof admin, "admin">
  | GroupSpec.NamedAt<typeof matches, "matches">
  | GroupSpec.NamedAt<typeof migrations, "migrations">
  | GroupSpec.NamedAt<typeof presence, "presence">
  | GroupSpec.NamedAt<typeof rounds, "rounds">
  | GroupSpec.NamedAt<typeof settings, "settings">
  | GroupSpec.NamedAt<typeof turns, "turns">
> = Spec.make().addAt("admin", admin).addAt("matches", matches).addAt("migrations", migrations).addAt("presence", presence).addAt("rounds", rounds).addAt("settings", settings).addAt("turns", turns);

export default spec;
