import { legalCache } from "@/lib/redis/methods/legal";
import { Footer } from "./footer";

export async function FooterWithLegal(props: GenericProps) {
    const legal = await legalCache.get();

    return <Footer {...props} legal={legal} />;
}
