"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-general";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea-general";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { handleClientError } from "@/lib/utils";
import {
    CachedUser,
    CreateBrandRequest,
    createBrandRequestSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    BrandRequestDemoVideoUploaderDropzone,
    BrandRequestLogoUploaderDropzone,
} from "../dropzones";

interface PageProps {
    user: CachedUser;
}

export function BrandRequestForm({ user }: PageProps) {
    const router = useRouter();

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const [demoVideoPreview, setDemoVideoPreview] = useState<string | null>(
        null
    );
    const [demoVideoFile, setDemoVideoFile] = useState<File | null>(null);

    const form = useForm<CreateBrandRequest>({
        resolver: zodResolver(createBrandRequestSchema),
        defaultValues: {
            name: "",
            email: user.email,
            phone: "",
            message: "",
            website: "",
            logoUrl: "",
            demoUrl: "",
            hasAcceptedTerms: false,
        },
    });

    const { startUpload: startDemoVideoUpload } = useUploadThing(
        "brandRequestDemoUploader"
    );
    const { startUpload: startLogoUpload } = useUploadThing(
        "brandRequestLogoUploader"
    );

    const { mutateAsync: createRequestAsync } =
        trpc.general.brands.requests.createRequest.useMutation();

    const { mutate: sendRequest, isPending: isRequestSending } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Sending request...");
            return { toastId };
        },
        mutationFn: async (values: CreateBrandRequest) => {
            if (!logoFile) throw new Error("Logo is required");

            const [logoRes, videoRes] = await Promise.all([
                startLogoUpload([logoFile]),
                demoVideoFile ? startDemoVideoUpload([demoVideoFile]) : null,
            ]);

            if (!logoRes?.length) throw new Error("Failed to upload logo");
            if (demoVideoFile && !videoRes?.length)
                throw new Error("Failed to upload demo video");

            const logo = logoRes[0];
            const demoVideo = videoRes ? videoRes[0] : null;

            values.logoUrl = logo.appUrl;
            if (demoVideo) values.demoUrl = demoVideo.appUrl;

            return await createRequestAsync(values);
        },
        onSuccess: (res, data, { toastId }) => {
            toast.success(
                "Request sent successfully, we'll get back to you soon",
                { id: toastId }
            );

            setLogoPreview(null);
            setLogoFile(null);

            setDemoVideoPreview(null);
            setDemoVideoFile(null);

            form.reset(data);
            router.refresh();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => sendRequest(values))}
            >
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        General Information
                    </h2>

                    <Separator />

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand Name</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter brand name"
                                            disabled={isRequestSending}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col items-end gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <div className="flex items-center gap-1">
                                            <FormLabel>Brand Email</FormLabel>

                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button>
                                                            <Icons.CircleHelp className="size-4" />
                                                        </button>
                                                    </TooltipTrigger>

                                                    <TooltipContent className="max-w-72">
                                                        <p>
                                                            This email will be
                                                            used to contact you
                                                            regarding your
                                                            request, brand
                                                            updates, and other
                                                            important
                                                            information.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter brand email"
                                                disabled
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Phone</FormLabel>

                                        <FormControl>
                                            <Input
                                                inputMode="tel"
                                                placeholder="Enter brand phone number"
                                                disabled={isRequestSending}
                                                {...field}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value.replace(
                                                            /[^0-9-+]/g,
                                                            ""
                                                        );

                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Brand Website</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand website"
                                                disabled={isRequestSending}
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>

                                    <FormControl>
                                        <Textarea
                                            placeholder="Briefly discuss about your brand, your goals, and why you want to work with us"
                                            minRows={8}
                                            disabled={isRequestSending}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="logoUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Logo</FormLabel>

                                    <BrandRequestLogoUploaderDropzone
                                        file={logoFile}
                                        form={form}
                                        isPending={isRequestSending}
                                        preview={logoPreview}
                                        setFile={setLogoFile}
                                        setPreview={setLogoPreview}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="demoUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Demo Video</FormLabel>

                                    <BrandRequestDemoVideoUploaderDropzone
                                        file={demoVideoFile}
                                        form={form}
                                        isPending={isRequestSending}
                                        preview={demoVideoPreview}
                                        setFile={setDemoVideoFile}
                                        setPreview={setDemoVideoPreview}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="hasAcceptedTerms"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isRequestSending}
                                    />
                                </FormControl>

                                <FormLabel>
                                    I agree to the{" "}
                                    <Link
                                        href="/terms"
                                        target="_blank"
                                        className="text-primary underline"
                                    >
                                        Terms and Conditions
                                    </Link>{" "}
                                    and{" "}
                                    <Link
                                        href="/privacy"
                                        target="_blank"
                                        className="text-primary underline"
                                    >
                                        Privacy Policy
                                    </Link>{" "}
                                    of the website.
                                </FormLabel>
                            </div>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isRequestSending || !form.formState.isDirty}
                >
                    Send Request
                </Button>
            </form>
        </Form>
    );
}
