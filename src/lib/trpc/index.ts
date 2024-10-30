import {
    blogsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contactUsRouter,
    newsletterSubscriberRouter,
    tagsRouter,
    usersRouter,
} from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogs: blogsRouter,
    brandsWaitlist: brandsWaitlistRouter,
    categories: categoriesRouter,
    contactUs: contactUsRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    tags: tagsRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
