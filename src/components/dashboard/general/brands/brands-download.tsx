"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { convertValueToLabel } from "@/lib/utils";
import { CachedBrand } from "@/lib/validations";
import { unparse } from "papaparse";
import { toast } from "sonner";

interface PageProps {
    data: CachedBrand[];
}

export function BrandsDownload({ data }: PageProps) {
    const handleDownload = () => {
        try {
            const csvData = data.map((brand) => {
                const activeSub = brand.subscriptions.find((s) => s.isActive);
                const members = brand.members.map(
                    (m) => `${m.firstName} ${m.lastName}`
                );

                return {
                    "Brand ID": brand.id,
                    "Brand Name": brand.name,
                    Bio: brand.bio || "N/A",
                    Email: brand.email,
                    Phone: brand.phone,
                    Website: brand.website || "N/A",
                    "Owner Name": `${brand.owner.firstName} ${brand.owner.lastName}`,
                    "Total Members": brand.members.length,
                    "Member Names": members.join(", "),
                    "Current Plan": activeSub?.plan.name || "No Active Plan",
                    "Subscribed At": activeSub
                        ? new Date(activeSub.startAt).toLocaleDateString()
                        : "N/A",
                    "Subscription Ends":
                        activeSub && activeSub.expireBy
                            ? new Date(activeSub.expireBy).toLocaleDateString()
                            : "N/A",
                    "Verification Status": convertValueToLabel(
                        brand.confidentialVerificationStatus
                    ),
                    "Created At": new Date(
                        brand.createdAt
                    ).toLocaleDateString(),
                };
            });

            const csv = unparse(csvData, {
                quotes: true,
                header: true,
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = [
                "renivet",
                "brands",
                "export",
                new Date().toISOString().split("T")[0],
                ".csv",
            ].join("_");
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success("Brands exported successfully");
        } catch (error) {
            toast.error("Failed to export brands");
            console.error(error);
        }
    };

    return (
        <Button size="icon" variant="outline" onClick={handleDownload}>
            <Icons.Download />
            <span className="sr-only">xport Brands</span>
        </Button>
    );
}
