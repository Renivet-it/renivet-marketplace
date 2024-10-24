import { blogsRouter, usersRouter } from "./routes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    blogs: blogsRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
