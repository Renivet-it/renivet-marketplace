import {
    blogsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contactUsRouter,
    contentRouter,
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
    content: contentRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    roles: rolesRouter,
    tags: tagsRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
