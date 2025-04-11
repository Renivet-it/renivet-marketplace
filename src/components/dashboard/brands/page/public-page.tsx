"use client";

import {
    BrandPageManageForm,
    BrandPageSectionManage,
} from "@/components/globals/forms";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, getAbsoluteURL, handleClientError } from "@/lib/utils";
import { CachedBrand, ProductWithBrand } from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";
import { PageSectionCarousel } from "./page-section-carousel";

interface PageProps {
    initialBrand: CachedBrand;
    products: ProductWithBrand[];
}

export function PublicPage({ initialBrand, products }: PageProps) {
    const coverInputRef = useRef<HTMLInputElement>(null!);
    const logoInputRef = useRef<HTMLInputElement>(null!);

    const [isSectionAddModalOpen, setIsSectionAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { data: brand, refetch } = trpc.brands.brands.getBrand.useQuery(
        { id: initialBrand.id },
        { initialData: initialBrand }
    );

    const [logoPreview, setLogoPreview] = useState<string>(brand.logoUrl);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const [coverPreview, setCoverPreview] = useState<string | null>(
        brand.coverUrl
    );
    const [coverFile, setCoverFile] = useState<File | null>(null);

    const websiteUrlRaw = brand.website;
    const doesUrlIncludeHttp =
        websiteUrlRaw?.includes("http://") ||
        websiteUrlRaw?.includes("https://");
    const websiteUrl = doesUrlIncludeHttp
        ? websiteUrlRaw
        : `http://${websiteUrlRaw}`;

    const { startUpload: startCoverUpload, routeConfig } = useUploadThing(
        "brandCoverUploader",
        {
            onUploadError(e) {
                toast.error(e.message);
            },
        }
    );
    const { startUpload: startLogoUpload } = useUploadThing(
        "brandLogoUploader",
        {
            onUploadError(e) {
                toast.error(e.message);
            },
        }
    );

    const { mutateAsync: updateAsync } =
        trpc.brands.brands.updateBrand.useMutation();

    const { mutate: updateCover, isPending: isCoverUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Uploading cover, please do not close or refresh the page..."
            );
            return { toastId };
        },
        mutationFn: async (file: File) => {
            if (!file) throw new Error("No file selected");

            const res = await startCoverUpload([file]);
            if (!res?.length) throw new Error("Failed to upload cover");

            const [{ appUrl }] = res;
            await updateAsync({
                id: brand.id,
                values: {
                    ...brand,
                    coverUrl: appUrl,
                },
            });
        },
        onSuccess: (_, __, { toastId }) => {
            refetch();
            setCoverPreview(URL.createObjectURL(coverFile!));
            setCoverFile(null);
            toast.success("Cover uploaded successfully", { id: toastId });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: updateLogo, isPending: isLogoUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Uploading logo, please do not close or refresh the page..."
            );
            return { toastId };
        },
        mutationFn: async (file: File) => {
            if (!file) throw new Error("No file selected");

            const res = await startLogoUpload([file]);
            if (!res?.length) throw new Error("Failed to upload logo");

            const [{ appUrl }] = res;
            await updateAsync({
                id: brand.id,
                values: {
                    ...brand,
                    logoUrl: appUrl,
                },
            });
        },
        onSuccess: (_, __, { toastId }) => {
            refetch();
            setLogoPreview(URL.createObjectURL(logoFile!));
            setLogoFile(null);
            toast.success("Logo uploaded successfully", { id: toastId });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <>
            <div className="space-y-2 md:space-y-0">
                <div
                    className={cn(
                        "relative flex aspect-[4/1] items-center justify-center overflow-hidden rounded-md border border-secondary",
                        !coverPreview && "bg-muted",
                        coverPreview && "group"
                    )}
                >
                    {coverPreview ? (
                        <>
                            <div className="absolute inset-0 bg-black opacity-0 transition-all ease-in-out group-hover:opacity-50" />

                            <Image
                                src={coverPreview}
                                alt="Pottery Design"
                                height={2000}
                                width={2000}
                                className="size-full object-cover"
                            />

                            <Button
                                size="sm"
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs opacity-0 group-hover:opacity-100 md:text-sm"
                                onClick={() => coverInputRef.current.click()}
                                disabled={isCoverUpdating}
                            >
                                <Icons.Upload />
                                Change Cover
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            className="text-xs md:text-sm"
                            onClick={() => coverInputRef.current.click()}
                            disabled={isCoverUpdating}
                        >
                            <Icons.Upload />
                            Upload Cover
                        </Button>
                    )}

                    <input
                        ref={coverInputRef}
                        type="file"
                        className="hidden"
                        accept={generatePermittedFileTypes(
                            routeConfig
                        ).fileTypes.join()}
                        onChange={(e) => {
                            if (!e.target.files) return;
                            setCoverFile(e.target.files[0]);
                            updateCover(e.target.files[0]);
                        }}
                    />
                </div>

                <div className="flex items-center justify-between gap-5 px-2 md:-translate-y-5 md:px-10">
                    <div className="flex items-center gap-4">
                        <Avatar className="group relative size-14 border-2 border-secondary md:size-32">
                            <div className="absolute inset-0 flex items-center justify-center bg-black opacity-0 group-hover:opacity-50" />

                            <Button
                                size="icon"
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent text-xs opacity-0 hover:bg-background hover:text-foreground group-hover:opacity-100 md:text-sm"
                                onClick={() => logoInputRef.current.click()}
                                disabled={isLogoUpdating}
                            >
                                <Icons.Upload />
                                <span className="sr-only">Change Logo</span>
                            </Button>

                            <input
                                ref={logoInputRef}
                                type="file"
                                className="hidden"
                                accept={generatePermittedFileTypes(
                                    routeConfig
                                ).fileTypes.join()}
                                onChange={(e) => {
                                    if (!e.target.files) return;
                                    setLogoFile(e.target.files[0]);
                                    updateLogo(e.target.files[0]);
                                }}
                            />

                            <AvatarImage
                                src={logoPreview}
                                alt="Brand Logo"
                                className="size-full object-cover"
                            />
                            <AvatarFallback>{brand.name[0]}</AvatarFallback>
                        </Avatar>

                        <div>
                            <h3 className="text-lg font-bold md:text-2xl">
                                {brand.name}
                            </h3>
                            <p className="text-xs text-muted-foreground md:text-sm">
                                @{brand.slug}
                            </p>
                        </div>
                    </div>

                    <div>
                        <Button
                            size="sm"
                            className="text-xs md:text-sm"
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    getAbsoluteURL(`/brands/${brand.id}`)
                                );
                                toast.success("Link copied to clipboard");
                            }}
                        >
                            <Icons.Forward />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            <Separator className="md:-translate-y-5" />

            <div className="grid gap-10 md:-translate-y-5 md:grid-cols-6">
                <div className="h-min space-y-4 rounded-md border border-secondary p-4 md:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold">About</h3>

                        <Button
                            size="icon"
                            className="size-8"
                            variant="ghost"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <Icons.Pencil />
                            <span className="sr-only">Edit</span>
                        </Button>
                    </div>

                    <p className="flex justify-center text-center text-sm">
                        {!!brand.bio?.length ? brand.bio : "No bio available"}
                    </p>

                    {/* <Separator />

                    <div className="space-y-1">
                        <Link
                            href={`mailto:${brand.email}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Icons.Mail className="size-4" />
                            <span>{brand.email}</span>
                        </Link>

                        <Link
                            href={`tel:${brand.phone}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Icons.Phone className="size-4" />
                            <span>{brand.phone}</span>
                        </Link>

                        {!!websiteUrl && (
                            <Link
                                href={websiteUrl}
                                className="flex items-center gap-2 text-sm"
                            >
                                <Icons.Globe className="size-4" />
                                <span>{brand.website}</span>
                            </Link>
                        )}
                    </div> */}
                </div>

                <div className="space-y-4 md:col-span-4">
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={() => setIsSectionAddModalOpen(true)}
                        >
                            <Icons.Plus />
                            Add Section
                        </Button>
                    </div>

                    {brand.pageSections.map((section) => (
                        <PageSectionCarousel
                            key={section.id}
                            brand={brand}
                            pageSection={section}
                            products={products}
                        />
                    ))}
                </div>
            </div>

            <Dialog
                open={isSectionAddModalOpen}
                onOpenChange={setIsSectionAddModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Section</DialogTitle>
                        <DialogDescription>
                            Add a new section to your brand page
                        </DialogDescription>
                    </DialogHeader>

                    <BrandPageSectionManage
                        brand={brand}
                        setIsOpen={setIsSectionAddModalOpen}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Details</DialogTitle>
                        <DialogDescription>
                            Update your brand details
                        </DialogDescription>
                    </DialogHeader>

                    <BrandPageManageForm
                        brand={brand}
                        setIsOpen={setIsEditModalOpen}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
