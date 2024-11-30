import {
    bansRouter as brandBansRouter,
    invitesRouter as brandInvitesRouter,
    membersRouter as brandMembersRouter,
    rolesRouter as brandRolesRouter,
} from "./routes/brands";
import {
    blogsRouter,
    brandsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contentRouter,
    newsletterSubscriberRouter,
    productTypesRouter,
    rolesRouter,
    subCategoriesRouter,
    tagsRouter,
    ticketRouter,
    usersRouter,
} from "./routes/general";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    general: createTRPCRouter({
        blogs: blogsRouter,
        brands: brandsRouter,
        brandsWaitlist: brandsWaitlistRouter,
        categories: categoriesRouter,
        content: contentRouter,
        newsletterSubscribers: newsletterSubscriberRouter,
        productTypes: productTypesRouter,
        roles: rolesRouter,
        subCategories: subCategoriesRouter,
        tags: tagsRouter,
        tickets: ticketRouter,
        users: usersRouter,
    }),
    brands: createTRPCRouter({
        bans: brandBansRouter,
        invites: brandInvitesRouter,
        members: brandMembersRouter,
        roles: brandRolesRouter,
    }),
});

export type AppRouter = typeof appRouter;
