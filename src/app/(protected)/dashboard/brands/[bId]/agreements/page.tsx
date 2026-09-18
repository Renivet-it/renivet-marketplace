import { BrandAgreementList } from "@/components/brand-agreements/agreement-repository";
import { DashShell } from "@/components/globals/layouts";

export const metadata = {
    title: "Brand agreements",
    description: "View your brand agreements",
};

export default function BrandAgreementsPage() {
    return (
        <DashShell className="max-w-none">
            <BrandAgreementList />
        </DashShell>
    );
}
