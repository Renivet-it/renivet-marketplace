import { env } from "@/../env";
import { PostHog } from "posthog-node";

export const posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
});
