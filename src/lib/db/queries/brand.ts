import {
    BrandWithOwnerAndMembers,
    brandWithOwnerAndMembersSchema,
    CreateBrand,
} from "@/lib/validations";
import { desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { brands } from "../schema";

class BrandQuery {
    async getBrands({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.brands.findMany({
            with: {
                owner: true,
                members: {
                    with: {
                        member: true,
                    },
                },
            },
            where: !!search?.length
                ? ilike(brands.name, `%${search}%`)
                : undefined,
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(brands.createdAt)],
            extras: {
                count: db
                    .$count(
                        brands,
                        !!search?.length
                            ? ilike(brands.name, `%${search}%`)
                            : undefined
                    )
                    .as("brand_count"),
            },
        });

        const parsed: BrandWithOwnerAndMembers[] = data.map(
            ({ members, ...rest }) =>
                brandWithOwnerAndMembersSchema.parse({
                    ...rest,
                    members: members.map(({ member }) => member),
                })
        );

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBrand(id: string) {
        const data = await db.query.brands.findFirst({
            where: eq(brands.id, id),
            with: {
                owner: true,
                members: true,
            },
        });

        return brandWithOwnerAndMembersSchema.parse(data);
    }

    async createBrand(values: CreateBrand) {
        const data = await db
            .insert(brands)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandQueries = new BrandQuery();
