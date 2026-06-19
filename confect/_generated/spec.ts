import { Spec } from "@confect/core";
import admin from "../admin.spec";
import matches from "../matches.spec";
import migrations from "../migrations.spec";
import presence from "../presence.spec";
import rounds from "../rounds.spec";
import settings from "../settings.spec";
import turns from "../turns.spec";

export default Spec.make().addAt("admin", admin).addAt("matches", matches).addAt("migrations", migrations).addAt("presence", presence).addAt("rounds", rounds).addAt("settings", settings).addAt("turns", turns);
