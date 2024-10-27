import {
    blogsRouter,
    blogTagsRouter,
    brandsWaitlistRouter,
    contactUsRouter,
    newsletterSubscriberRouter,
    usersRouter,
} from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogTags: blogTagsRouter,
    blogs: blogsRouter,
    contactUs: contactUsRouter,
    brandsWaitlist: brandsWaitlistRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
