import { ProductDiscountsWorkspace } from "@/components/dashboard/general/settings/product-discounts-workspace";
import { assertFinanceDashboardAccess } from "@/lib/finance/page-access";

export default async function ProductDiscountsPage() {
    await assertFinanceDashboardAccess();
    return <ProductDiscountsWorkspace canManage />;
}
