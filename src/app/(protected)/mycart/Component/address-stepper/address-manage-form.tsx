"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-general";
import { Card } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-general";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-general";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc/client";
import { cn, convertValueToLabel, handleClientError } from "@/lib/utils";
import {
    Address,
    CreateAddress,
    createAddressSchema,
    UserWithAddressesRolesAndBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    address?: Omit<Address, "createdAt" | "updatedAt">;
    user: UserWithAddressesRolesAndBrand;
    setFormOpen: Dispatch<SetStateAction<boolean>>;
    setSelectedAddress: Dispatch<
        SetStateAction<Omit<Address, "createdAt" | "updatedAt"> | undefined>
    >;
}

export function AddressManageForm({
    address,
    user,
    setFormOpen,
    setSelectedAddress,
}: PageProps) {
    const { refetch } = trpc.general.users.currentUser.useQuery();
    const states = useMemo(() => State.getStatesOfCountry("IN"), []);

    const form = useForm<CreateAddress>({
        resolver: zodResolver(createAddressSchema),
        defaultValues: {
            alias: address?.alias ?? "",
            fullName: address?.fullName ?? "",
            street: address?.street ?? "",
            city: address?.city ?? "",
            state: address?.state ?? "",
            zip: address?.zip ?? "",
            phone: address?.phone ?? "",
            type: address?.type ?? "home",
            isPrimary: address?.isPrimary ?? user.addresses.length === 0,
        },
    });

    useEffect(() => {
        if (address) {
            form.reset({
                alias: address.alias ?? "",
                fullName: address.fullName,
                street: address.street,
                city: address.city,
                state: address.state,
                zip: address.zip,
                phone: address.phone,
                type: address.type,
                isPrimary: address.isPrimary,
            });
        }
    }, [address, form]);

    const { mutate: addAddress, isPending: isAddressAdding } =
        trpc.general.users.addresses.addAddress.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Adding address...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Address added successfully", { id: toastId });
                refetch();
                setFormOpen(false);
                form.reset();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateAddress, isPending: isAddressUpdating } =
        trpc.general.users.addresses.updateAddress.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating address...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Address updated successfully", { id: toastId });
                refetch();
                setFormOpen(false);
                setSelectedAddress(undefined);
                form.reset();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((data) =>
                    address
                        ? updateAddress({ id: address.id, data })
                        : addAddress(data)
                )}
            >
                <Card className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto">
                    <div className="space-y-2 p-3 sm:p-4">
                        {/* Contact Details Section */}
                        <div className="space-y-1 sm:space-y-1">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">Contact Details</h3>
                            <FormField
                                control={form.control}
                                name="alias"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-600">Address Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Home, Work, etc."
                                                disabled={
                                                    isAddressAdding ||
                                                    isAddressUpdating
                                                }
                                                className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-pink-500 w-full"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-600">FullName*</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                disabled={
                                                    isAddressAdding ||
                                                    isAddressUpdating
                                                }
                                                className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-pink-500 w-full"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-600">Mobile No*</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="tel"
                                                placeholder="+919874563210"
                                                disabled={
                                                    isAddressAdding ||
                                                    isAddressUpdating
                                                }
                                                className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-pink-500 w-full"
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(
                                                        /[^0-9-+]/g,
                                                        ""
                                                    );
                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address Section */}
                        <div className="space-y-1 sm:space-y-1">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">Address</h3>
                            <FormField
                                control={form.control}
                                name="zip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-600">Pin Code*</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="numeric"
                                                placeholder="123456"
                                                disabled={
                                                    isAddressAdding ||
                                                    isAddressUpdating
                                                }
                                                className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-pink-500 w-full"
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(
                                                        /[^0-9]/g,
                                                        ""
                                                    );
                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-600">
                                            Address (House No, Building, Street, Area)*
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="1234 Main St."
                                                disabled={
                                                    isAddressAdding || isAddressUpdating
                                                }
                                                className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-pink-500 w-full"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-1 sm:gap-2 sm:flex-row">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-xs text-gray-600">City/District*</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="City"
                                                    disabled={
                                                        isAddressAdding ||
                                                        isAddressUpdating
                                                    }
                                                    className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-pink-500 w-full"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-xs text-gray-600">State*</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={
                                                    isAddressAdding || isAddressUpdating
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-pink-500 w-full">
                                                        <SelectValue placeholder="Select State" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {states.map((state) => (
                                                        <SelectItem
                                                            key={state.isoCode}
                                                            value={state.isoCode}
                                                            className="text-xs"
                                                        >
                                                            {state.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Address Type Section */}
                        <div className="space-y-1 sm:space-y-1">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">Address Type</h3>
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={
                                                    isAddressAdding || isAddressUpdating
                                                }
                                                className="flex flex-col sm:flex-row gap-2 sm:gap-3"
                                            >
                                                {["home", "work", "other"].map((type) => (
                                                    <FormItem key={type} className="flex items-center space-x-2">
                                                        <FormControl>
                                                            <RadioGroupItem
                                                                value={type}
                                                                className="h-4 w-4 border-gray-400 text-green-700 focus:ring-pink-500"
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-xs text-gray-600 capitalize">
                                                            {convertValueToLabel(type)}
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Primary Address Checkbox */}
                        <FormField
                            control={form.control}
                            name="isPrimary"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center space-x-2">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                disabled={
                                                    isAddressAdding ||
                                                    isAddressUpdating ||
                                                    (address && address.isPrimary) ||
                                                    user.addresses.length === 0
                                                }
                                                className="h-4 w-4 border-gray-300 rounded text-pink-500 focus:ring-pink-500"
                                            />
                                        </FormControl>
                                        <FormLabel className="text-xs text-gray-600">
                                            Make this as my primary address
                                        </FormLabel>
                                    </div>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-200 flex-wrap">
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isAddressAdding || isAddressUpdating}
                            onClick={() => {
                                form.reset();
                                setFormOpen(false);
                                setSelectedAddress(undefined);
                            }}
                            className="text-gray-600 border hover:bg-green-600 border-gray-300 rounded-md px-3 py-1 text-xs min-w-[70px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                isAddressAdding ||
                                isAddressUpdating ||
                                !form.formState.isDirty
                            }
                            className="bg-green-700 text-white hover:bg-green-600 rounded-md px-3 py-1 text-xs min-w-[70px]"
                        >
                            {address ? "Update" : "Add"} Address
                        </Button>
                    </div>
                </Card>
            </form>
        </Form>
    );
}