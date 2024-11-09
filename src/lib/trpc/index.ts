import {
    blogsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contactUsRouter,
    newsletterSubscriberRouter,
    rolesRouter,
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
    roles: rolesRouter,
    tags: tagsRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
