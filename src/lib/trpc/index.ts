import {
    blogsRouter,
    brandsWaitlistRouter,
    contactUsRouter,
    newsletterSubscriberRouter,
    tagsRouter,
    usersRouter,
} from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogs: blogsRouter,
    brandsWaitlist: brandsWaitlistRouter,
    contactUs: contactUsRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    tags: tagsRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
