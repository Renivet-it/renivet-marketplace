import { ProductSlugMigrationWorkspace } from "@/components/dashboard/general/settings/product-slug-migration-workspace";
import { assertSlugMigrationAdminAccess } from "@/lib/finance/slug-migration-page-access";

export default async function ProductSlugMigrationPage() {
    await assertSlugMigrationAdminAccess();
    return <ProductSlugMigrationWorkspace />;
}
