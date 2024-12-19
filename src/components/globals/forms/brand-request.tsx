"use client";

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
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { handleClientError } from "@/lib/utils";
import {
    CreateBrandRequest,
    createBrandRequestSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    BrandRequestBankVerificationUploaderDropzone,
    BrandRequestDemoVideoUploaderDropzone,
    BrandRequestIECCertificateUploaderDropzone,
    BrandRequestLogoUploaderDropzone,
    BrandRequestUdyamCertificateUploaderDropzone,
} from "../dropzones";

export function BrandRequestForm() {
    const router = useRouter();

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const [demoVideoPreview, setDemoVideoPreview] = useState<string | null>(
        null
    );
    const [demoVideoFile, setDemoVideoFile] = useState<File | null>(null);

    const [bankVerificationPreview, setBankVerificationPreview] = useState<
        string | null
    >(null);
    const [bankVerificationFile, setBankVerificationFile] =
        useState<File | null>(null);

    const [udyamCertificatePreview, setUdyamCertificatePreview] = useState<
        string | null
    >(null);
    const [udyamCertificateFile, setUdyamCertificateFile] =
        useState<File | null>(null);

    const [iecCertificatePreview, setIecCertificatePreview] = useState<
        string | null
    >(null);
    const [iecCertificateFile, setIecCertificateFile] = useState<File | null>(
        null
    );

    const form = useForm<CreateBrandRequest>({
        resolver: zodResolver(createBrandRequestSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            message: "",
            website: "",
            logoUrl: "",
            demoUrl: "",
            gstin: "",
            pan: "",
            bankName: "",
            bankAccountHolderName: "",
            bankAccountNumber: "",
            bankIfscCode: "",
            bankAccountVerificationDocumentUrl: "",
            authorizedSignatoryName: "",
            authorizedSignatoryEmail: "",
            authorizedSignatoryPhone: "",
            hasAcceptedTerms: false,
            udyamRegistrationCertificateUrl: "",
            iecCertificateUrl: "",
        },
    });

    const { startUpload: startDemoVideoUpload } = useUploadThing(
        "brandRequestDemoUploader"
    );
    const { startUpload: startLogoUpload } = useUploadThing(
        "brandRequestLogoUploader"
    );
    const { startUpload: startDocUpload } = useUploadThing(
        "brandRequestDocUploader"
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
            if (!bankVerificationFile)
                throw new Error("Bank verification document is required");

            const [
                logoRes,
                videoRes,
                bankVerificationRes,
                udyamCertRes,
                iecCertRes,
            ] = await Promise.all([
                startLogoUpload([logoFile]),
                demoVideoFile ? startDemoVideoUpload([demoVideoFile]) : null,
                startDocUpload([bankVerificationFile]),
                udyamCertificateFile
                    ? startDocUpload([udyamCertificateFile])
                    : null,
                iecCertificateFile
                    ? startDocUpload([iecCertificateFile])
                    : null,
            ]);

            if (!logoRes?.length) throw new Error("Failed to upload logo");
            if (demoVideoFile && !videoRes?.length)
                throw new Error("Failed to upload demo video");
            if (!bankVerificationRes?.length)
                throw new Error("Failed to upload bank verification document");
            if (udyamCertificateFile && !udyamCertRes?.length)
                throw new Error("Failed to upload Udyam certificate");
            if (iecCertificateFile && !iecCertRes?.length)
                throw new Error("Failed to upload IEC certificate");

            const logo = logoRes[0];
            const demoVideo = videoRes ? videoRes[0] : null;
            const bankVerification = bankVerificationRes[0];
            const udyamCert = udyamCertRes ? udyamCertRes[0] : null;
            const iecCert = iecCertRes ? iecCertRes[0] : null;

            values.logoUrl = logo.url;
            if (demoVideo) values.demoUrl = demoVideo.url;
            values.bankAccountVerificationDocumentUrl = bankVerification.url;
            if (udyamCert)
                values.udyamRegistrationCertificateUrl = udyamCert.url;
            if (iecCert) values.iecCertificateUrl = iecCert.url;

            await createRequestAsync(values);
        },
        onSuccess: (_, data, { toastId }) => {
            toast.success(
                "Request sent successfully, we'll get back to you soon",
                { id: toastId }
            );

            setLogoPreview(null);
            setLogoFile(null);

            setDemoVideoPreview(null);
            setDemoVideoFile(null);

            setBankVerificationPreview(null);
            setBankVerificationFile(null);

            setUdyamCertificatePreview(null);
            setUdyamCertificateFile(null);

            setIecCertificatePreview(null);
            setIecCertificateFile(null);

            form.reset(data);
            router.refresh();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    useEffect(() => {
        console.log(form.formState.isDirty);
    }, [form.formState.isDirty]);

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

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Brand Email</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand email"
                                                disabled={isRequestSending}
                                                {...field}
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

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Business Information
                    </h2>

                    <Separator />

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="gstin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>GSTIN</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your brand's GST Identification Number"
                                            disabled={isRequestSending}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>PAN</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your brand's Permanent Account Number"
                                            disabled={isRequestSending}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Bank Name</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter your brand's bank name"
                                                disabled={isRequestSending}
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankAccountHolderName"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Bank Account Holder Name
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter bank account holder name (with proper casing)"
                                                disabled={isRequestSending}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="bankAccountNumber"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Bank Account Number
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter bank account number"
                                                disabled={isRequestSending}
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankIfscCode"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Bank IFSC Code</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter bank IFSC code"
                                                disabled={isRequestSending}
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="bankAccountVerificationDocumentUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>
                                        Bank Verification Document (Cancelled
                                        Cheque, Bank Statement, etc.)
                                    </FormLabel>

                                    <BrandRequestBankVerificationUploaderDropzone
                                        file={bankVerificationFile}
                                        form={form}
                                        isPending={isRequestSending}
                                        preview={bankVerificationPreview}
                                        setFile={setBankVerificationFile}
                                        setPreview={setBankVerificationPreview}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="authorizedSignatoryName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Authorized Contact Person Name
                                    </FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter authorized contact person name"
                                            disabled={isRequestSending}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="authorizedSignatoryEmail"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Authorized Contact Person Email
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter authorized contact person email"
                                                disabled={isRequestSending}
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="authorizedSignatoryPhone"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Authorized Contact Person Phone
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                inputMode="tel"
                                                placeholder="Enter authorized contact person phone number"
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
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Optional Information
                    </h2>

                    <Separator />

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="udyamRegistrationCertificateUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>
                                        Udyam Certificate (if applicable for
                                        MSMEs)
                                    </FormLabel>

                                    <BrandRequestUdyamCertificateUploaderDropzone
                                        file={udyamCertificateFile}
                                        form={form}
                                        isPending={isRequestSending}
                                        preview={udyamCertificatePreview}
                                        setFile={setUdyamCertificateFile}
                                        setPreview={setUdyamCertificatePreview}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="iecCertificateUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>IEC Certificate</FormLabel>

                                    <BrandRequestIECCertificateUploaderDropzone
                                        file={iecCertificateFile}
                                        form={form}
                                        isPending={isRequestSending}
                                        preview={iecCertificatePreview}
                                        setFile={setIecCertificateFile}
                                        setPreview={setIecCertificatePreview}
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
                        <FormItem>
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
