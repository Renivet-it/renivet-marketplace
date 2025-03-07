"use client";

import { TableCoupon } from "@/components/dashboard/coupons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogClose, DialogFooter } from "@/components/ui/dialog-dash";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import PriceInput from "@/components/ui/price-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    convertPriceToPaise,
    convertValueToLabel,
    generateId,
    handleClientError,
} from "@/lib/utils";
import {
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    CreateCoupon,
    createCouponSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    coupon?: TableCoupon;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    categories: CachedCategory[];
    subcategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

export function CouponManageForm({
    coupon,
    setIsOpen,
    categories,
    subcategories,
    productTypes,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [isActive] = useQueryState(
        "isActive",
        parseAsBoolean.withDefault(true)
    );

    const { refetch } = trpc.general.coupons.getCoupons.useQuery({
        page,
        limit,
        search,
        isActive,
    });

    const form = useForm<CreateCoupon>({
        resolver: zodResolver(createCouponSchema),
        defaultValues: {
            code: coupon?.code ?? generateId({ length: 8, casing: "upper" }),
            description: coupon?.description ?? "",
            discountType: coupon?.discountType ?? "percentage",
            discountValue: coupon?.discountValue
                ? coupon.discountType === "fixed"
                    ? parseInt(convertPaiseToRupees(coupon.discountValue))
                    : coupon.discountValue
                : 0,
            maxDiscountAmount: coupon?.maxDiscountAmount
                ? coupon.discountType === "fixed"
                    ? parseInt(convertPaiseToRupees(coupon.maxDiscountAmount))
                    : coupon.maxDiscountAmount
                : 0,
            minOrderAmount: coupon?.minOrderAmount
                ? parseInt(convertPaiseToRupees(coupon.minOrderAmount))
                : 0,
            maxUses: coupon?.maxUses ?? 0,
            categoryId: coupon?.categoryId ?? "",
            subCategoryId: coupon?.subCategoryId ?? "",
            productTypeId: coupon?.productTypeId ?? "",
            expiresAt:
                coupon?.expiresAt ??
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    const getSubCategories = useCallback(
        (categoryId: string) => {
            return subcategories.filter((sub) => sub.categoryId === categoryId);
        },
        [subcategories]
    );

    const getProductTypes = useCallback(
        (subcategoryId: string) => {
            return productTypes.filter(
                (productType) => productType.subCategoryId === subcategoryId
            );
        },
        [productTypes]
    );

    const { mutate: createCoupon, isPending: isCreating } =
        trpc.general.coupons.createCoupon.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating coupon...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Coupon created successfully", { id: toastId });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateCoupon, isPending: isUpdating } =
        trpc.general.coupons.updateCoupon.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating coupon...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Coupon updated successfully", { id: toastId });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const isPending = isCreating || isUpdating;

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => {
                    if (
                        values.maxDiscountAmount &&
                        values.discountValue &&
                        values.discountValue > 0 &&
                        values.maxDiscountAmount > 0
                    )
                        return toast.error(
                            "Both discount value and max discount amount cannot be set at the same time"
                        );

                    values = {
                        ...values,
                        discountValue:
                            values.discountType === "fixed"
                                ? convertPriceToPaise(values.discountValue)
                                : values.discountValue,
                        maxDiscountAmount: values.maxDiscountAmount
                            ? values.discountType === "fixed"
                                ? convertPriceToPaise(values.maxDiscountAmount)
                                : values.maxDiscountAmount
                            : null,
                        minOrderAmount: convertPriceToPaise(
                            values.minOrderAmount
                        ),
                    };

                    return !!coupon
                        ? updateCoupon({ code: coupon.code, values })
                        : createCoupon(values);
                })}
            >
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Code</FormLabel>

                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Enter code"
                                    disabled={isPending || !!coupon}
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
                                <Input
                                    {...field}
                                    placeholder="10% off on all products"
                                    value={field.value ?? ""}
                                    disabled={isPending}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Discount Type</FormLabel>

                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isPending || !!coupon}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select discount type" />
                                    </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                    {["percentage", "fixed"].map((x) => (
                                        <SelectItem key={x} value={x}>
                                            {convertValueToLabel(x)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <FormField
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <div className="flex items-center gap-1">
                                    <FormLabel>Discount</FormLabel>

                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button>
                                                    <Icons.CircleHelp className="size-4" />
                                                </button>
                                            </TooltipTrigger>

                                            <TooltipContent className="max-w-72">
                                                <p>
                                                    The value of the discount.
                                                    If the discount type is
                                                    &ldquo;percentage&rdquo;,
                                                    the value should be a number
                                                    between 1 and 100. If the
                                                    discount type is
                                                    &ldquo;fixed &rdquo;, the
                                                    value should be a number
                                                    greater than 0. If max
                                                    discount amount is set, this
                                                    value should be left empty.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <FormControl>
                                    <PriceInput
                                        {...field}
                                        placeholder="Enter discount value"
                                        currency={
                                            form.watch("discountType") ===
                                            "percentage"
                                                ? "%"
                                                : "INR"
                                        }
                                        value={field.value ?? ""}
                                        disabled={
                                            ((form
                                                .watch("maxDiscountAmount")
                                                ?.toString().length ?? 0) > 0 &&
                                                +(
                                                    form.watch(
                                                        "maxDiscountAmount"
                                                    ) ?? 0
                                                ) > 0) ||
                                            isPending
                                        }
                                        onChange={(e) => {
                                            const value = parseInt(
                                                e.target.value
                                            );

                                            field.onChange(
                                                isNaN(value) ? 0 : value
                                            );
                                        }}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="maxDiscountAmount"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <div className="flex items-center gap-1">
                                    <FormLabel>Max Discount</FormLabel>

                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button>
                                                    <Icons.CircleHelp className="size-4" />
                                                </button>
                                            </TooltipTrigger>

                                            <TooltipContent className="max-w-72">
                                                <p>
                                                    The maximum amount of
                                                    discount that can be
                                                    applied. This value should
                                                    be greater than 0. If
                                                    discount value is set, this
                                                    value should be left empty.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <FormControl>
                                    <PriceInput
                                        {...field}
                                        placeholder="Enter max discount amount"
                                        currency={
                                            form.watch("discountType") ===
                                            "percentage"
                                                ? "%"
                                                : "INR"
                                        }
                                        value={field.value ?? ""}
                                        disabled={
                                            (form
                                                .watch("discountValue")
                                                .toString().length > 0 &&
                                                +form.watch("discountValue") >
                                                    0) ||
                                            isPending
                                        }
                                        onChange={(e) => {
                                            const value = parseInt(
                                                e.target.value
                                            );

                                            field.onChange(
                                                isNaN(value) ? 0 : value
                                            );
                                        }}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="minOrderAmount"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Minimum Order Amount</FormLabel>

                                <FormControl>
                                    <PriceInput
                                        {...field}
                                        placeholder="Enter minimum order amount"
                                        disabled={isPending}
                                        onChange={(e) => {
                                            const value = parseInt(
                                                e.target.value
                                            );

                                            field.onChange(
                                                isNaN(value) ? 0 : value
                                            );
                                        }}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="maxUses"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Max Uses</FormLabel>

                            <FormControl>
                                <Input
                                    {...field}
                                    disabled={isPending}
                                    placeholder="Enter max uses"
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        field.onChange(
                                            isNaN(value) ? 0 : value
                                        );
                                    }}
                                />
                            </FormControl>

                            <FormDescription>
                                The maximum number of times this invite can be
                                used. Set to 0 for infinite uses.
                            </FormDescription>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <div className="flex items-center gap-1">
                                    <FormLabel>Category</FormLabel>

                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button>
                                                    <Icons.CircleHelp className="size-4" />
                                                </button>
                                            </TooltipTrigger>

                                            <TooltipContent className="max-w-72">
                                                <p>
                                                    The category this coupon is
                                                    applicable to. If not set,
                                                    the coupon will be
                                                    applicable to all
                                                    categories.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                    disabled={isPending || !!coupon}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>

                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
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
                        name="subCategoryId"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <div className="flex items-center gap-1">
                                    <FormLabel>Sub Category</FormLabel>

                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button>
                                                    <Icons.CircleHelp className="size-4" />
                                                </button>
                                            </TooltipTrigger>

                                            <TooltipContent className="max-w-72 space-y-2">
                                                <p>
                                                    The sub category this coupon
                                                    is applicable to. If not
                                                    set, the coupon will be
                                                    applicable to all sub
                                                    categories.
                                                </p>

                                                <p>
                                                    If category is set, but no
                                                    sub category is set, the
                                                    coupon will be applicable to
                                                    all sub categories of the
                                                    selected category.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                    disabled={
                                        getSubCategories(
                                            form.watch("categoryId") ?? ""
                                        ).length === 0 ||
                                        isPending ||
                                        !!coupon
                                    }
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select sub category" />
                                        </SelectTrigger>
                                    </FormControl>

                                    <SelectContent>
                                        {getSubCategories(
                                            form.watch("categoryId") ?? ""
                                        ).map((subCategory) => (
                                            <SelectItem
                                                key={subCategory.id}
                                                value={subCategory.id}
                                            >
                                                {subCategory.name}
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
                        name="productTypeId"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <div className="flex items-center gap-1">
                                    <FormLabel>Product Type</FormLabel>

                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button>
                                                    <Icons.CircleHelp className="size-4" />
                                                </button>
                                            </TooltipTrigger>

                                            <TooltipContent className="max-w-72 space-y-2">
                                                <p>
                                                    The product type this coupon
                                                    is applicable to. If not
                                                    set, the coupon will be
                                                    applicable to all product
                                                    types.
                                                </p>

                                                <p>
                                                    If sub category is set, but
                                                    no product type is set, the
                                                    coupon will be applicable to
                                                    all product types of the
                                                    selected sub category.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                    disabled={
                                        getProductTypes(
                                            form.watch("subCategoryId") ?? ""
                                        ).length === 0 ||
                                        isPending ||
                                        !!coupon
                                    }
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product type" />
                                        </SelectTrigger>
                                    </FormControl>

                                    <SelectContent>
                                        {getProductTypes(
                                            form.watch("subCategoryId") ?? ""
                                        ).map((productType) => (
                                            <SelectItem
                                                key={productType.id}
                                                value={productType.id}
                                            >
                                                {productType.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-2 space-y-0">
                            <div className="flex items-center justify-between gap-2">
                                <FormLabel>Expires At</FormLabel>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="doNotExpire"
                                        checked={!field.value}
                                        disabled={isPending}
                                        onCheckedChange={(checked) =>
                                            checked
                                                ? field.onChange(null)
                                                : field.onChange(
                                                      new Date(
                                                          Date.now() +
                                                              7 *
                                                                  24 *
                                                                  60 *
                                                                  60 *
                                                                  1000
                                                      )
                                                  )
                                        }
                                    />
                                    <label
                                        htmlFor="doNotExpire"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        No Expiry
                                    </label>
                                </div>
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal",
                                                !field.value &&
                                                    "text-muted-foreground"
                                            )}
                                            disabled={!field.value || isPending}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}

                                            <Icons.Calendar className="ml-auto size-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={field.value ?? undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date() ||
                                            !field.value ||
                                            isPending
                                        }
                                    />
                                </PopoverContent>
                            </Popover>

                            <FormDescription>
                                The date and time this coupon will expire. Check
                                &ldquo;No Expiry&rdquo; for a coupon that never
                                expires.
                            </FormDescription>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={isPending || !form.formState.isDirty}
                    >
                        {!!coupon ? "Update" : "Create"} Coupon
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
