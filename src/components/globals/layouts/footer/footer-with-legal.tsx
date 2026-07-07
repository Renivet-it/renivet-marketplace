import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { legalCache } from "@/lib/redis/methods/legal";
import { Footer } from "./footer";

export async function FooterWithLegal(props: GenericProps) {
    const [legal, activeGro] = await Promise.all([
        legalCache.get(),
        financeComplianceQueries.getActiveLegalContactByRole("gro"),
    ]);

    const mergedLegal = {
        ...legal,
        grievanceOfficerName: activeGro?.name ?? legal?.grievanceOfficerName,
        grievanceOfficerEmail: activeGro?.email ?? legal?.grievanceOfficerEmail,
        grievanceOfficerPhone: activeGro?.phone ?? legal?.grievanceOfficerPhone,
        grievanceOfficerAddress: activeGro?.address ?? legal?.grievanceOfficerAddress,
    };

    return <Footer {...props} legal={mergedLegal} />;
}
