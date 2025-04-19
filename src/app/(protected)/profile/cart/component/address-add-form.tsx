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
import { CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, convertValueToLabel, handleClientError } from "@/lib/utils";
import {
    CreateAddress,
    createAddressSchema,
    UserWithAddressesRolesAndBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import { Dispatch, SetStateAction, useMemo } from "react";
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
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => addAddress(data))}>
                <CardContent className="space-y-6">
                    {/* Row 1 */}
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
                                            disabled={isAddressAdding}
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
                                            disabled={isAddressAdding}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Street */}
                    <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Street Address</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="1234 Main St."
                                        disabled={isAddressAdding}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Row 2 */}
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
                                            disabled={isAddressAdding}
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
                                        disabled={isAddressAdding}
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

                    {/* Row 3 */}
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
                                            disabled={isAddressAdding}
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
                                            placeholder="+919876543210"
                                            disabled={isAddressAdding}
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

                    {/* Type Radio Group */}
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
                                        className="grid gap-4 md:grid-cols-3"
                                    >
                                        {["home", "work", "other"].map(
                                            (type) => (
                                                <FormItem key={type}>
                                                    <FormLabel
                                                        className={cn(
                                                            "group flex flex-col items-center justify-between gap-4 border border-muted bg-popover p-4 py-10 hover:bg-accent [&:has([data-state=checked])]:border-primary",
                                                            isAddressAdding &&
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
                                                                isAddressAdding &&
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

                    {/* Is Primary Switch */}
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

                {/* Footer Buttons */}
                <CardFooter className="justify-end gap-2 py-4 transition-all ease-in-out">
                    <Button
                        type="reset"
                        variant="ghost"
                        size="sm"
                        disabled={isAddressAdding}
                        onClick={() => {
                            form.reset();
                            onCancel?.();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={
                            isAddressAdding || !form.formState.isDirty
                        }
                    >
                        Add Address
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
