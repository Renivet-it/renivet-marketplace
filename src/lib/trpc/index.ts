import {
    blogsRouter,
    brandsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contentRouter,
    newsletterSubscriberRouter,
    rolesRouter,
    tagsRouter,
    ticketRouter,
    usersRouter,
} from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogs: blogsRouter,
    brands: brandsRouter,
    brandsWaitlist: brandsWaitlistRouter,
    categories: categoriesRouter,
    content: contentRouter,
    newsletterSubscribers: newsletterSubscriberRouter,
    roles: rolesRouter,
    tags: tagsRouter,
    tickets: ticketRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
