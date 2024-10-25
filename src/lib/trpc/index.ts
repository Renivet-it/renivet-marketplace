import {
    blogsRouter,
    brandsWaitlistRouter,
    newsletterSubscriberRouter,
    usersRouter,
} from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogs: blogsRouter,
    brandsWaitlist: brandsWaitlistRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
