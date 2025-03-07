import { bannerSchema, CreateBanner, UpdateBanner } from "@/lib/validations";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { banners } from "../schema";

class BannerQuery {
    async getBanners({
        limit,
        page,
        isActive,
        search,
    }: {
        limit: number;
        page: number;
        isActive?: boolean;
        search?: string;
    }) {
        const data = await db.query.banners.findMany({
            where: and(
                isActive !== undefined
                    ? eq(banners.isActive, isActive)
                    : undefined,
                !!search?.length
                    ? ilike(banners.title, `%${search}%`)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(banners.createdAt)],
            extras: {
                count: db
                    .$count(
                        banners,
                        and(
                            isActive !== undefined
                                ? eq(banners.isActive, isActive)
                                : undefined,
                            !!search?.length
                                ? ilike(banners.title, `%${search}%`)
                                : undefined
                        )
                    )
                    .as("banner_count"),
            },
        });

        const parsed = bannerSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBanner(id: string) {
        const data = await db.query.banners.findFirst({
            where: eq(banners.id, id),
        });

        return data;
    }

    async createBanner(
        values: CreateBanner & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(banners)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBanner(
        id: string,
        values: UpdateBanner & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(banners)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(banners.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBannerStatus(id: string, isActive: boolean) {
        const data = await db
            .update(banners)
            .set({
                isActive,
                updatedAt: new Date(),
            })
            .where(eq(banners.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBanner(id: string) {
        const data = await db
            .delete(banners)
            .where(eq(banners.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const bannerQueries = new BannerQuery();
