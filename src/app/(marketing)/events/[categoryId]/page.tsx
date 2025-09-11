import { ShopEventProducts } from "@/components/shop/shop-event-products";
import { getEventProducts } from "@/actions/event-page";
import { auth } from "@clerk/nextjs/server";
import { userWishlistCache } from "@/lib/redis/methods";

export default async function CategoryEventPage({
  params,
}: {
  params: { categoryId: string };
}) {
  const { userId } = await auth();

  const filters = {
    page: 1,
    limit: 24,
    categoryId: params.categoryId,
  };

  const [data, userWishlist] = await Promise.all([
    getEventProducts(filters),
    userId ? userWishlistCache.get(userId) : undefined,
  ]);

  return (
    <ShopEventProducts
      initialData={data}
      initialWishlist={userWishlist}
      userId={userId ?? undefined}
       showCarousel={false}
    />

  );
}
