"use client";

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
import { Button } from "@/components/ui/button-general";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { trpc } from "@/lib/trpc/client";

interface AddAddressFormProps {
    user: UserWithAddressesRolesAndBrand;
    onCancel?: () => void;
    onSuccess: () => void;
}

export default function AddAddressForm({ user, onSuccess, onCancel }: AddAddressFormProps) {
    const { refetch } = trpc.general.users.currentUser.useQuery();
    const states = useMemo(() => State.getStatesOfCountry("IN"), []);

    const form = useForm<CreateAddress>({
        resolver: zodResolver(createAddressSchema),
        defaultValues: {
            alias: "",
            fullName: "",
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

    const onSubmit = (data: CreateAddress) => {
        console.log("Form submitted with data:", data); // Debug log
        addAddress(data);
    };

    const onError = (errors: any) => {
        console.log("Validation errors:", errors); // Debug log
        toast.error("Please fix the errors in the form before submitting.");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)}>
                <Card className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto">
                    <div className="space-y-3 p-4 sm:p-5"> {/* Balanced padding */}

                        {/* Contact Details Section */}
                        <div className="space-y-2 sm:space-y-2"> {/* Balanced spacing */}
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">Contact Details</h3>
                            <FormField
                                control={form.control}
                                name="alias"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-600">Address Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Address Name (e.g., Home, Office)"
                                                disabled={isAddressAdding}
                                                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-pink-500 w-full" // Balanced for mobile
                                                {...field}
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
                                        <FormLabel className="text-sm text-gray-600">Full Name*</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Name"
                                                disabled={isAddressAdding}
                                                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-pink-500 w-full" // Balanced for mobile
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
                                        <FormLabel className="text-sm text-gray-600">Mobile No*</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="tel"
                                                placeholder="Mobile No"
                                                disabled={isAddressAdding}
                                                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-pink-500 w-full" // Balanced for mobile
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9-+]/g, "");
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
                        <div className="space-y-2 sm:space-y-2"> {/* Balanced spacing */}
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">Address</h3>
                            <FormField
                                control={form.control}
                                name="zip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-gray-600">Pin Code*</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="numeric"
                                                placeholder="Pin Code"
                                                disabled={isAddressAdding}
                                                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-pink-500 w-full" // Balanced for mobile
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, "");
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
                                            Address (House No, Building, Street, Area)*
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Please update flat/house no and society/apartment details"
                                                disabled={isAddressAdding}
                                                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-pink-500 w-full" // Balanced for mobile
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row"> {/* Balanced gap */}
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-sm text-gray-600">City/District*</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="City/District"
                                                    disabled={isAddressAdding}
                                                    className="border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-pink-500 w-full" // Balanced for mobile
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
                                            <FormLabel className="text-sm text-gray-600">State*</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isAddressAdding}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-pink-500 w-full"> {/* Balanced for mobile */}
                                                        <SelectValue placeholder="State" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {states.map((state) => (
                                                        <SelectItem key={state.isoCode} value={state.isoCode} className="text-sm">
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
                        <div className="space-y-2 sm:space-y-2"> {/* Balanced spacing */}
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
                                                disabled={isAddressAdding}
                                                className="flex flex-col sm:flex-row gap-3 sm:gap-4" // Balanced gap
                                            >
                                                {["home", "work", "other"].map((type) => (
                                                    <FormItem key={type} className="flex items-center space-x-2">
                                                        <FormControl>
                                                            <RadioGroupItem
                                                                value={type}
                                                                className="h-5 w-5 border-gray-400 text-green-700 focus:ring-pink-500" // Consistent size
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm text-gray-600 capitalize">
                                                            {type}
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
                                                disabled={isAddressAdding || user.addresses.length === 0}
                                                className="h-5 w-5 border-gray-300 rounded text-pink-500 focus:ring-pink-500" // Consistent size
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
                    <div className="flex justify-end gap-3 p-4 sm:p-5 border-t border-gray-200 flex-wrap"> {/* Balanced gap and padding */}
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isAddressAdding}
                            onClick={() => {
                                form.reset();
                                onCancel?.();
                            }}
                            className="text-gray-600 border hover:bg-green-600 border-gray-300 rounded-md px-4 py-2 text-sm min-w-[80px]" // Improved tap target
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isAddressAdding || !form.formState.isDirty}
                            onClick={() => console.log("Save button clicked, isDirty:", form.formState.isDirty)} // Debug log
                            className="bg-green-700 text-white hover:bg-green-600 rounded-md px-4 py-2 text-sm min-w-[80px]" // Improved tap target
                        >
                            Save
                        </Button>
                    </div>
                </Card>
            </form>
        </Form>
    );
}