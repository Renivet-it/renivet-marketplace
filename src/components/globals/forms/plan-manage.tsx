"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Editor, EditorRef } from "@/components/ui/editor";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import PriceInput from "@/components/ui/price-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertPriceToPaise,
    convertValueToLabel,
    handleClientError,
} from "@/lib/utils";
import { CreatePlan, createPlanSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function PlanManageForm() {
    const editorRef = useRef<EditorRef>(null!);

    const form = useForm<Omit<CreatePlan, "id">>({
        resolver: zodResolver(createPlanSchema.omit({ id: true })),
        defaultValues: {
            amount: 0,
            interval: 1,
            currency: "INR",
            description: "",
            isActive: false,
            name: "",
            period: "monthly",
        },
    });

    const { refetch } = trpc.general.plans.getPlans.useQuery({
        isDeleted: false,
    });

    const { mutate: createPlan, isPending: isCreating } =
        trpc.general.plans.createPlan.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating plan...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Plan created successfully", { id: toastId });
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                    createPlan({
                        ...values,
                        amount: convertPriceToPaise(values.amount),
                    })
                )}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter plan name"
                                    {...field}
                                    disabled={isCreating}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>

                            <FormControl>
                                <Editor
                                    {...field}
                                    ref={editorRef}
                                    content={field.value ?? ""}
                                    disabled={isCreating}
                                    onChange={field.onChange}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>

                            <FormControl>
                                <PriceInput
                                    placeholder="2000.00"
                                    currency="INR"
                                    symbol="₹"
                                    {...field}
                                    onChange={(e) => {
                                        const regex = /^[0-9]*\.?[0-9]{0,2}$/;
                                        if (regex.test(e.target.value))
                                            field.onChange(e);
                                    }}
                                    disabled={isCreating}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-center gap-4">
                    <FormField
                        control={form.control}
                        name="interval"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Interval</FormLabel>

                                <FormControl>
                                    <div>
                                        <div className="flex -space-x-px shadow-sm shadow-black/5 rtl:space-x-reverse">
                                            <div>
                                                <Button
                                                    type="button"
                                                    className="rounded-none rounded-l-md shadow-none"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Increment interval"
                                                    disabled={isCreating}
                                                    onClick={() =>
                                                        field.onChange(
                                                            Math.min(
                                                                field.value + 1,
                                                                Number.MAX_SAFE_INTEGER
                                                            )
                                                        )
                                                    }
                                                    onMouseDown={() => {
                                                        const interval =
                                                            setInterval(() => {
                                                                field.onChange(
                                                                    (
                                                                        prevValue: number
                                                                    ) =>
                                                                        Math.min(
                                                                            prevValue +
                                                                                1,
                                                                            Number.MAX_SAFE_INTEGER
                                                                        )
                                                                );
                                                            }, 200);

                                                        const handleMouseUp =
                                                            () => {
                                                                clearInterval(
                                                                    interval
                                                                );
                                                                window.removeEventListener(
                                                                    "mouseup",
                                                                    handleMouseUp
                                                                );
                                                            };

                                                        window.addEventListener(
                                                            "mouseup",
                                                            handleMouseUp
                                                        );
                                                    }}
                                                >
                                                    <Icons.ChevronUp
                                                        size={16}
                                                        strokeWidth={2}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="sr-only">
                                                        Increment quantity
                                                    </span>
                                                </Button>
                                            </div>

                                            <div className="flex w-full items-center justify-center border border-input text-sm">
                                                {field.value}
                                            </div>

                                            <div>
                                                <Button
                                                    type="button"
                                                    className="rounded-none rounded-r-md shadow-none"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Decrement quantity"
                                                    onClick={() =>
                                                        field.onChange(
                                                            Math.max(
                                                                field.value - 1,
                                                                1
                                                            )
                                                        )
                                                    }
                                                    disabled={isCreating}
                                                    onMouseDown={() => {
                                                        const interval =
                                                            setInterval(() => {
                                                                field.onChange(
                                                                    (
                                                                        prevValue: number
                                                                    ) =>
                                                                        Math.max(
                                                                            prevValue -
                                                                                1,
                                                                            1
                                                                        )
                                                                );
                                                            }, 200);

                                                        const handleMouseUp =
                                                            () => {
                                                                clearInterval(
                                                                    interval
                                                                );
                                                                window.removeEventListener(
                                                                    "mouseup",
                                                                    handleMouseUp
                                                                );
                                                            };

                                                        window.addEventListener(
                                                            "mouseup",
                                                            handleMouseUp
                                                        );
                                                    }}
                                                >
                                                    <Icons.ChevronDown
                                                        size={16}
                                                        strokeWidth={2}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="sr-only">
                                                        Decrement quantity
                                                    </span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Period</FormLabel>

                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isCreating}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                    </FormControl>

                                    <SelectContent>
                                        {[
                                            "daily",
                                            "weekly",
                                            "monthly",
                                            "yearly",
                                        ].map((period) => (
                                            <SelectItem
                                                key={period}
                                                value={period}
                                            >
                                                {convertValueToLabel(period)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={!form.formState.isDirty || isCreating}
                    className="w-full"
                >
                    Create Plan
                </Button>
            </form>
        </Form>
    );
}
