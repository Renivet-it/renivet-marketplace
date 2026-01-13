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
    CreateAddress,
    createAddressSchema,
    UserWithAddressesRolesAndBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Extended schema with firstName and lastName validation
const addAddressFormSchema = createAddressSchema
    .omit({ fullName: true })
    .extend({
        firstName: z
            .string({
                required_error: "First name is required",
            })
            .min(2, "First name must be at least 2 characters"),
        lastName: z
            .string({
                required_error: "Last name is required",
            })
            .min(2, "Last name must be at least 2 characters"),
    });

type AddAddressFormValues = z.infer<typeof addAddressFormSchema>;

interface AddAddressFormProps {
    user: UserWithAddressesRolesAndBrand;
    onCancel?: () => void;
    onSuccess: () => void;
}

export default function AddAddressForm({
    user,
    onSuccess,
    onCancel,
}: AddAddressFormProps) {
    const { refetch } = trpc.general.users.currentUser.useQuery();
    const states = useMemo(() => State.getStatesOfCountry("IN"), []);

    const form = useForm<AddAddressFormValues>({
        resolver: zodResolver(addAddressFormSchema),
        defaultValues: {
            alias: "",
            firstName: "",
            lastName: "",
            street: "",
            city: "",
            state: "",
            zip: "",
            phone: "",
            type: "home",
            isPrimary: user.addresses.length === 0,
        },
    });

    const { mutate: addAddress, isPending: isAddressAdding } =
        trpc.general.users.addresses.addAddress.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Adding address...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Address added successfully", { id: toastId });
                refetch();
                onSuccess();
                form.reset();
            },
            onError: (err, _, ctx) => {
                console.error("Error adding address:", err); // Debug log
                return handleClientError(err, ctx?.toastId);
            },
        });

    const onSubmit = (data: AddAddressFormValues) => {
        const { firstName, lastName, ...rest } = data;
        const fullName = `${firstName} ${lastName}`.trim();
        console.log("Form submitted with data:", { ...rest, fullName }); // Debug log
        addAddress({ ...rest, fullName });
    };

    const onError = (errors: any) => {
        console.log("Validation errors:", errors); // Debug log
        toast.error("Please fix the errors in the form before submitting.");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)}>
                <Card className="mx-auto w-full max-w-3xl rounded-lg bg-white shadow-lg">
                    <div className="space-y-3 p-4 sm:p-5">
                        {" "}
                        {/* Balanced padding */}
                        {/* Contact Details Section */}
                        <div className="space-y-2 sm:space-y-2">
                            {" "}
                            {/* Balanced spacing */}
                            <h3 className="text-sm font-semibold uppercase text-gray-700">
                                Contact Details
                            </h3>
                            <FormField
                                control={form.control}
                                name="alias"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-600">
                                            Address Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Address Name (e.g., Home, Office)"
                                                disabled={isAddressAdding}
                                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500" // Balanced for mobile
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-sm text-gray-600">
                                                First Name*
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="First Name"
                                                    disabled={isAddressAdding}
                                                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-sm text-gray-600">
                                                Last Name*
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Last Name"
                                                    disabled={isAddressAdding}
                                                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-600">
                                            Mobile No*
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="tel"
                                                placeholder="Mobile No"
                                                disabled={isAddressAdding}
                                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500" // Balanced for mobile
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
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {/* Address Section */}
                        <div className="space-y-2 sm:space-y-2">
                            {" "}
                            {/* Balanced spacing */}
                            <h3 className="text-sm font-semibold uppercase text-gray-700">
                                Address
                            </h3>
                            <FormField
                                control={form.control}
                                name="zip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-600">
                                            Pin Code*
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="numeric"
                                                placeholder="Pin Code"
                                                disabled={isAddressAdding}
                                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500" // Balanced for mobile
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
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-600">
                                            Address (House No, Building, Street,
                                            Area)*
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Please update flat/house no and society/apartment details"
                                                disabled={isAddressAdding}
                                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500" // Balanced for mobile
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                {" "}
                                {/* Balanced gap */}
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-sm text-gray-600">
                                                City/District*
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="City/District"
                                                    disabled={isAddressAdding}
                                                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500" // Balanced for mobile
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
                                            <FormLabel className="text-sm text-gray-600">
                                                State*
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isAddressAdding}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-1 focus:ring-pink-500">
                                                        {" "}
                                                        {/* Balanced for mobile */}
                                                        <SelectValue placeholder="State" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {states.map((state) => (
                                                        <SelectItem
                                                            key={state.isoCode}
                                                            value={
                                                                state.isoCode
                                                            }
                                                            className="text-sm"
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
                        <div className="space-y-2 sm:space-y-2">
                            {" "}
                            {/* Balanced spacing */}
                            <h3 className="text-sm font-semibold uppercase text-gray-700">
                                Address Type
                            </h3>
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isAddressAdding}
                                                className="flex flex-col gap-3 sm:flex-row sm:gap-4" // Balanced gap
                                            >
                                                {["home", "work", "other"].map(
                                                    (type) => (
                                                        <FormItem
                                                            key={type}
                                                            className="flex items-center space-x-2"
                                                        >
                                                            <FormControl>
                                                                <RadioGroupItem
                                                                    value={type}
                                                                    className="h-5 w-5 border-gray-400 text-green-700 focus:ring-pink-500" // Consistent size
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm capitalize text-gray-600">
                                                                {type}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                )}
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
                                                    user.addresses.length === 0
                                                }
                                                className="h-5 w-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500" // Consistent size
                                            />
                                        </FormControl>
                                        <FormLabel className="text-sm text-gray-600">
                                            Make this as my primary address
                                        </FormLabel>
                                    </div>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 p-4 sm:p-5">
                        {" "}
                        {/* Balanced gap and padding */}
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isAddressAdding}
                            onClick={() => {
                                form.reset();
                                onCancel?.();
                            }}
                            className="min-w-[80px] rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-green-600" // Improved tap target
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                isAddressAdding || !form.formState.isDirty
                            }
                            onClick={() =>
                                console.log(
                                    "Save button clicked, isDirty:",
                                    form.formState.isDirty
                                )
                            } // Debug log
                            className="min-w-[80px] rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-600" // Improved tap target
                        >
                            Save
                        </Button>
                    </div>
                </Card>
            </form>
        </Form>
    );
}
