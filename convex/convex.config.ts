import { defineApp } from "convex/server";
import { v } from "convex/values";
import migrations from "@convex-dev/migrations/convex.config.js";
import presence from "@convex-dev/presence/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import posthog from "@posthog/convex/convex.config.js";
import convexCascadingDeletes from "@sholajegede/convex-cascading-deletes/convex.config.js";

import "../confect/lib/cascading_deletes";

const app = defineApp({
  env: {
    POSTHOG_PROJECT_TOKEN: v.string(),
    POSTHOG_HOST: v.optional(v.string()),
    POSTHOG_PERSONAL_API_KEY: v.optional(v.string()),
    POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS: v.optional(v.string()),
  },
});

app.use(migrations);
app.use(presence);
app.use(rateLimiter);
app.use(posthog, {
  env: {
    POSTHOG_PROJECT_TOKEN: app.env.POSTHOG_PROJECT_TOKEN,
    POSTHOG_HOST: app.env.POSTHOG_HOST,
    POSTHOG_PERSONAL_API_KEY: app.env.POSTHOG_PERSONAL_API_KEY,
    POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS: app.env.POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS,
  },
});
app.use(convexCascadingDeletes);

export default app;
