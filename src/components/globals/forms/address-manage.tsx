"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-general";
import { CardContent, CardFooter } from "@/components/ui/card";
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
    UserWithAddressesAndRoles,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    address?: Omit<Address, "createdAt" | "updatedAt">;
    user: UserWithAddressesAndRoles;
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
    const { refetch } = trpc.users.currentUser.useQuery();

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
        trpc.users.addresses.addAddress.useMutation({
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
        trpc.users.addresses.updateAddress.useMutation({
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
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4 md:flex-row">
                        <FormField
                            control={form.control}
                            name="alias"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Alias</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Home, Work, etc."
                                            disabled={
                                                isAddressAdding ||
                                                isAddressUpdating
                                            }
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Full Name</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="John Doe"
                                            disabled={
                                                isAddressAdding ||
                                                isAddressUpdating
                                            }
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
                        name="street"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Street Address</FormLabel>

                                <FormControl>
                                    <Input
                                        placeholder="1234 Main St."
                                        disabled={
                                            isAddressAdding || isAddressUpdating
                                        }
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
                            name="city"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>City</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="City"
                                            disabled={
                                                isAddressAdding ||
                                                isAddressUpdating
                                            }
                                            {...field}
                                            value={field.value ?? ""}
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
                                        disabled={
                                            isAddressAdding || isAddressUpdating
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                        </FormControl>

                                        <SelectContent>
                                            {states.map((state) => (
                                                <SelectItem
                                                    key={state.isoCode}
                                                    value={state.isoCode}
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
                    </div>

                    <div className="flex flex-col items-center gap-4 md:flex-row">
                        <FormField
                            control={form.control}
                            name="zip"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Zip</FormLabel>

                                    <FormControl>
                                        <Input
                                            inputMode="numeric"
                                            placeholder="123456"
                                            disabled={
                                                isAddressAdding ||
                                                isAddressUpdating
                                            }
                                            {...field}
                                            onChange={(e) => {
                                                const value =
                                                    e.target.value.replace(
                                                        /[^0-9]/g,
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
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Phone</FormLabel>

                                    <FormControl>
                                        <Input
                                            inputMode="tel"
                                            placeholder="+919874563210"
                                            disabled={
                                                isAddressAdding ||
                                                isAddressUpdating
                                            }
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

                    <Separator />

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
                                        className="grid gap-4 md:grid-cols-3"
                                    >
                                        {["home", "work", "other"].map(
                                            (type) => (
                                                <FormItem key={type}>
                                                    <FormLabel
                                                        className={cn(
                                                            "group flex flex-col items-center justify-between gap-4 border border-muted bg-popover p-4 py-10 hover:bg-accent [&:has([data-state=checked])]:border-primary",
                                                            (isAddressAdding ||
                                                                isAddressUpdating) &&
                                                                "opacity-50 hover:bg-popover"
                                                        )}
                                                    >
                                                        <FormControl>
                                                            <RadioGroupItem
                                                                value={type}
                                                                className="sr-only"
                                                            />
                                                        </FormControl>

                                                        <Avatar>
                                                            <AvatarFallback>
                                                                {type[0]}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <span
                                                            className={cn(
                                                                "group-hover:text-accent-foreground",
                                                                (isAddressAdding ||
                                                                    isAddressUpdating) &&
                                                                    "group-hover:text-popover-foreground"
                                                            )}
                                                        >
                                                            {convertValueToLabel(
                                                                type
                                                            )}
                                                        </span>
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        )}
                                    </RadioGroup>
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isPrimary"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex w-min flex-row-reverse items-center justify-start gap-2">
                                    <FormLabel className="whitespace-nowrap font-semibold">
                                        Set as primary address
                                    </FormLabel>

                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={
                                                isAddressAdding ||
                                                isAddressUpdating ||
                                                (address &&
                                                    address.isPrimary) ||
                                                user.addresses.length === 0
                                            }
                                        />
                                    </FormControl>
                                </div>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>

                <Separator />

                <CardFooter className="justify-end gap-2 py-4 transition-all ease-in-out">
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
                    >
                        {address ? "Update" : "Add"} Address
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
