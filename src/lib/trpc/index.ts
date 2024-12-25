import {
    bansRouter as brandBansRouter,
    invitesRouter as brandInvitesRouter,
    membersRouter as brandMembersRouter,
    productsRouter as brandProductsRouter,
    rolesRouter as brandRolesRouter,
} from "./routes/brands";
import {
    blogsRouter,
    brandsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contentRouter,
    legalRouter,
    newsletterSubscriberRouter,
    ordersRouter,
    plansRouter,
    productReviewsRouter,
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
        legal: legalRouter,
        newsletterSubscribers: newsletterSubscriberRouter,
        orders: ordersRouter,
        plans: plansRouter,
        productReviews: productReviewsRouter,
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
        products: brandProductsRouter,
        roles: brandRolesRouter,
    }),
});

export type AppRouter = typeof appRouter;
