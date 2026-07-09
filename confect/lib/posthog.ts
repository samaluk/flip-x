import { PostHog } from "@posthog/convex";

import { components } from "../_generated/components";

export const posthog = new PostHog(components.posthog);
