import { blogsRouter, newsletterSubscriberRouter, usersRouter } from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogs: blogsRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
