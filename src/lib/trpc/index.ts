
import {
    blogsRouter,
    brandsRouter,
    brandsWaitlistRouter,
    categoriesRouter,
    contentRouter,
    couponRouter,
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
        coupons: couponRouter,
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

});

export type AppRouter = typeof appRouter;
