import {
    blogsRouter,
    blogTagsRouter,
    brandsWaitlistRouter,
    newsletterSubscriberRouter,
    usersRouter,
} from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogTags: blogTagsRouter,
    blogs: blogsRouter,
    brandsWaitlist: brandsWaitlistRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
