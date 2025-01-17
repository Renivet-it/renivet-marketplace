"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Separator } from "@/components/ui/separator";
import { SheetFooter } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    BrandConfidentialWithBrand,
    UpdateBrandConfidentialByAdmin,
    updateBrandConfidentialByAdminSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    data: BrandConfidentialWithBrand;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BrandConfidentialEditAdmin({ data, setIsOpen }: PageProps) {
    const router = useRouter();

    const form = useForm<UpdateBrandConfidentialByAdmin>({
        resolver: zodResolver(updateBrandConfidentialByAdminSchema),
        defaultValues: data,
    });

    const states = State.getStatesOfCountry("IN");

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [status] = useQueryState(
        "status",
        parseAsStringLiteral([
            "pending",
            "approved",
            "rejected",
        ] as const).withDefault("pending")
    );
    const { refetch } =
        trpc.general.brands.verifications.getVerifications.useQuery({
            page,
            limit,
            search,
            status,
        });

    const { mutate: updateData, isPending: isUpdating } =
        trpc.general.brands.verifications.editDetails.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating brand details...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Brand details updated", { id: toastId });
                refetch();
                setIsOpen(false);
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <Form {...form}>
                <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit((values) =>
                        updateData({
                            id: data.id,
                            values,
                        })
                    )}
                >
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Business Information
                        </h2>

                        <Separator />

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="gstin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GSTIN</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter your brand's GST Identification Number"
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Bank Name</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter your brand's bank name"
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

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
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
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

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Address Information
                        </h2>

                        <Separator />

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="addressLine1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Street 1</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered street address"
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="addressLine2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Street 2</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered street address"
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>City</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered city"
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>State</FormLabel>

                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isUpdating}
                                        >
                                            <SelectTrigger>
                                                <FormControl>
                                                    <SelectValue placeholder="Select brand's registered state" />
                                                </FormControl>
                                            </SelectTrigger>

                                            <SelectContent>
                                                {states.map((state) => (
                                                    <SelectItem
                                                        key={state.isoCode}
                                                        value={state.name}
                                                    >
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Postal Code</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered postal code"
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Country</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered country"
                                                disabled
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isUpdating || !form.formState.isDirty}
                        >
                            Save Changes
                        </Button>
                    </SheetFooter>
                </form>
            </Form>
        </>
    );
}
