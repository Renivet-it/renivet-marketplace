import { ProductHsnImportWorkspace } from "@/components/dashboard/general/settings/product-hsn-import-workspace";
import { assertFinanceDashboardAccess } from "@/lib/finance/page-access";

export default async function ProductHsnImportPage() {
    await assertFinanceDashboardAccess();
    return <ProductHsnImportWorkspace />;
}
