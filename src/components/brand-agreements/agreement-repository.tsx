"use client";

import { useUploadThing } from "@/lib/uploadthing";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button-dash";
import { useState } from "react";
import { toast } from "sonner";

type BrandOption = { id: string; name: string };

function AgreementRows({
    agreements,
    onDownload,
}: {
    agreements: Array<{
        id: string;
        version: number;
        fileName: string;
        contentType: string;
        fileSizeBytes: number;
        effectiveDate: string;
        expiryDate: string | null;
        status: string;
    }>;
    onDownload: (id: string) => void;
}) {
    if (agreements.length === 0)
        return <p className="text-sm text-muted-foreground">Not on file.</p>;

    return (
        <div className="space-y-2">
            {agreements.map((agreement) => (
                <div
                    key={agreement.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                    <div>
                        <p className="font-medium">
                            v{agreement.version} · {agreement.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {agreement.status} · effective {agreement.effectiveDate}
                            {agreement.expiryDate
                                ? ` · expires ${agreement.expiryDate}`
                                : ""}
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => onDownload(agreement.id)}>
                        Download
                    </Button>
                </div>
            ))}
        </div>
    );
}

export function AdminAgreementRepository({ brands }: { brands: BrandOption[] }) {
    const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
    const [signedDate, setSignedDate] = useState("");
    const [effectiveDate, setEffectiveDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [status, setStatus] = useState<"draft" | "active" | "expired" | "superseded">("active");
    const [file, setFile] = useState<File | null>(null);

    const utils = trpc.useUtils();
    const agreements = trpc.general.brandAgreements.listAdmin.useQuery(
        { brandId: brandId || undefined },
        { enabled: Boolean(brandId) }
    );
    const create = trpc.general.brandAgreements.create.useMutation({
        onSuccess: async () => {
            toast.success("Agreement saved");
            setFile(null);
            await utils.general.brandAgreements.listAdmin.invalidate();
        },
        onError: (error) => toast.error(error.message),
    });
    const download = trpc.general.brandAgreements.getDownloadUrl.useMutation({
        onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
        onError: (error) => toast.error(error.message),
    });
    const { startUpload, isUploading } = useUploadThing("brandAgreementUploader");

    async function submit() {
        if (!brandId || !file || !signedDate || !effectiveDate) {
            toast.error("Brand, file, signed date, and effective date are required");
            return;
        }
        const uploaded = await startUpload([file]);
        const uploadedFile = uploaded?.[0];
        if (!uploadedFile) {
            toast.error("Agreement upload failed");
            return;
        }
        await create.mutateAsync({
            brandId,
            signedDate,
            effectiveDate,
            expiryDate: expiryDate || null,
            status,
            file: {
                key: uploadedFile.key,
                name: uploadedFile.name,
                size: uploadedFile.size,
                type: uploadedFile.type as
                    | "application/pdf"
                    | "application/msword"
                    | "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
        });
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border p-4">
                <h2 className="mb-4 text-lg font-semibold">Upload agreement</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <select className="rounded-md border p-2" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
                        <option value="">Select brand</option>
                        {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                    <input type="date" className="rounded-md border p-2" value={signedDate} onChange={(event) => setSignedDate(event.target.value)} aria-label="Signed date" />
                    <input type="date" className="rounded-md border p-2" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} aria-label="Effective date" />
                    <input type="date" className="rounded-md border p-2" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} aria-label="Expiry date" />
                    <select className="rounded-md border p-2" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                        <option value="draft">Draft</option><option value="active">Active</option><option value="expired">Expired</option>
                    </select>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                </div>
                <div className="mt-4 flex gap-2">
                    <Button type="button" onClick={submit} disabled={isUploading || create.isPending}>Upload agreement</Button>
                </div>
            </div>
            <div>
                <h2 className="mb-3 text-lg font-semibold">Agreement versions</h2>
                {agreements.isLoading ? <p>Loading…</p> : <AgreementRows agreements={agreements.data ?? []} onDownload={(id) => download.mutate({ agreementId: id })} />}
            </div>
        </div>
    );
}

export function BrandAgreementList() {
    const agreements = trpc.general.brandAgreements.listMine.useQuery();
    const download = trpc.general.brandAgreements.getDownloadUrl.useMutation({
        onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
        onError: (error) => toast.error(error.message),
    });
    return (
        <div className="space-y-3">
            <h1 className="text-2xl font-semibold">Brand agreements</h1>
            {agreements.isLoading ? <p>Loading…</p> : <AgreementRows agreements={agreements.data ?? []} onDownload={(id) => download.mutate({ agreementId: id })} />}
        </div>
    );
}
