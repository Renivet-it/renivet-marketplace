import { AdminAgreementRepository } from "@/components/brand-agreements/agreement-repository";
import { DashShell } from "@/components/globals/layouts";
import { brandCache } from "@/lib/redis/methods";

export const metadata = {
    title: "Brand agreements",
    description: "Manage private brand agreement versions",
};

export default async function BrandAgreementsPage() {
    const brands = await brandCache.getAll();
    return (
        <DashShell className="max-w-none">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Brand agreements</h1>
                <p className="text-sm text-muted-foreground">
                    Private agreement repository. Missing files are shown as Not on file.
                </p>
            </div>
            <AdminAgreementRepository
                brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
            />
        </DashShell>
    );
}
