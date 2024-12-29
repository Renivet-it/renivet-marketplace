"use client";

import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    FormControl,
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
import { TableCell, TableRow } from "@/components/ui/table";
import { PRESET_COLORS } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import { CreateProduct, ProductWithBrand } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    form: UseFormReturn<CreateProduct>;
    field: FieldArrayWithId<CreateProduct, "variants", "id">;
    remove: (index?: number | number[]) => void;
    index: number;
    isCreating: boolean;
    isUpdating: boolean;
    product?: ProductWithBrand;
}

export function ProductVariantManage({
    form,
    field,
    index,
    isCreating,
    isUpdating,
    product,
    remove,
}: PageProps) {
    const router = useRouter();

    const [activeColor, setActiveColor] = useState<string>("#ffffff");
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isAvailableModalOpen, setIsAvailableModalOpen] = useState(false);

    const variant = product?.variants.find(
        (variant) => variant.sku === field.sku
    );

    const { mutate: updateVariant, isPending: isVariantUpdating } =
        trpc.brands.products.updateVariantAvailability.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    variant?.isAvailable
                        ? "Marking variant as unavailable..."
                        : "Marking variant as available..."
                );

                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success(
                    variant?.isAvailable
                        ? "Variant marked as unavailable"
                        : "Variant marked as available",
                    { id: toastId }
                );
                router.refresh();
                setIsAvailableModalOpen(false);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <TableRow key={field.id}>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span
                            title={
                                variant?.isAvailable
                                    ? "Available"
                                    : "Unavailable"
                            }
                        >
                            {field.sku}
                        </span>
                        <div
                            title={
                                variant?.isAvailable
                                    ? "Available"
                                    : "Unavailable"
                            }
                            className={cn(
                                "size-1.5 rounded-full",
                                variant?.isAvailable
                                    ? "bg-green-600"
                                    : "bg-red-600"
                            )}
                        />
                    </div>
                </TableCell>

                <TableCell>
                    <FormField
                        control={form.control}
                        name={`variants.${index}.size`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="hidden">Size</FormLabel>

                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={
                                            isCreating ||
                                            isUpdating ||
                                            isVariantUpdating
                                        }
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </TableCell>

                <TableCell>
                    <FormField
                        control={form.control}
                        name={`variants.${index}.color`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="hidden">Color</FormLabel>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !field.value &&
                                                        "text-muted-foreground"
                                                )}
                                                disabled={
                                                    isCreating ||
                                                    isUpdating ||
                                                    isVariantUpdating
                                                }
                                                onClick={() =>
                                                    setActiveColor(
                                                        field.value.hex
                                                    )
                                                }
                                            >
                                                <div
                                                    className="mr-2 size-4 rounded-full border"
                                                    style={{
                                                        backgroundColor:
                                                            field.value.hex,
                                                    }}
                                                />
                                                {field.value.name ||
                                                    "Pick a color"}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="w-64 p-0"
                                        align="start"
                                    >
                                        <div className="grid grid-cols-3 gap-2 p-2">
                                            {PRESET_COLORS.map((color) => (
                                                <Button
                                                    key={color.hex}
                                                    variant="outline"
                                                    className="flex h-8 w-full items-center justify-center p-1"
                                                    style={{
                                                        backgroundColor:
                                                            color.hex,
                                                    }}
                                                    onClick={() =>
                                                        field.onChange({
                                                            name: color.name,
                                                            hex: color.hex,
                                                        })
                                                    }
                                                    disabled={
                                                        isCreating ||
                                                        isUpdating ||
                                                        isVariantUpdating
                                                    }
                                                />
                                            ))}
                                        </div>

                                        <div className="space-y-2 border-t p-2">
                                            <HexColorPicker
                                                color={activeColor}
                                                onChange={(color) => {
                                                    setActiveColor(color);
                                                    field.onChange({
                                                        name: "Custom",
                                                        hex: color,
                                                    });
                                                }}
                                            />

                                            <Input
                                                placeholder="Color name"
                                                value={field.value.name}
                                                onChange={(e) =>
                                                    field.onChange({
                                                        ...field.value,
                                                        name: e.target.value,
                                                    })
                                                }
                                                disabled={
                                                    isCreating ||
                                                    isUpdating ||
                                                    isVariantUpdating
                                                }
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </TableCell>

                <TableCell>
                    <FormField
                        control={form.control}
                        name={`variants.${index}.quantity`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="hidden">
                                    Quantity
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        min={0}
                                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        onChange={(e) =>
                                            field.onChange(
                                                parseInt(e.target.value)
                                            )
                                        }
                                        disabled={
                                            isCreating ||
                                            isUpdating ||
                                            isVariantUpdating
                                        }
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </TableCell>

                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Icons.MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuGroup>
                                {product && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsAvailableModalOpen(true)
                                        }
                                    >
                                        {product.variants.find(
                                            (variant) =>
                                                variant.sku === field.sku
                                        )?.isAvailable ? (
                                            <Icons.X />
                                        ) : (
                                            <Icons.Check />
                                        )}

                                        <span>
                                            {product.variants.find(
                                                (variant) =>
                                                    variant.sku === field.sku
                                            )?.isAvailable
                                                ? "Mark as Unavailable"
                                                : "Mark as Available"}
                                        </span>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                    onClick={() => setIsRemoveModalOpen(true)}
                                >
                                    <Icons.Trash />
                                    <span>Remove</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>

            <AlertDialog
                open={isRemoveModalOpen}
                onOpenChange={setIsRemoveModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to remove the variant &ldquo;
                            {field.sku}&rdquo;?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Removing this variant will permanently delete it
                            from the product. This action cannot be undone.
                            Instead of removing, you can mark it as unavailable.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsRemoveModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                remove(index);
                                setIsRemoveModalOpen(false);
                            }}
                        >
                            Remove
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={isAvailableModalOpen}
                onOpenChange={setIsAvailableModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to mark the variant &ldquo;
                            {field.sku}&rdquo; as &ldquo;
                            {variant?.isAvailable ? "unavailable" : "available"}
                            ?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {variant?.isAvailable
                                ? "Marking this variant as unavailable will hide it from the product page. Customers will not be able to purchase this variant."
                                : "Marking this variant as available will make it visible on the product page. Customers will be able to purchase this variant."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isVariantUpdating}
                            onClick={() => setIsAvailableModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isVariantUpdating}
                            onClick={() => {
                                if (!product)
                                    return toast.error("Product not found");

                                updateVariant({
                                    sku: field.sku,
                                    isAvailable: !variant?.isAvailable,
                                    productId: product.id,
                                });
                            }}
                        >
                            {variant?.isAvailable
                                ? "Mark as Unavailable"
                                : "Mark as Available"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
