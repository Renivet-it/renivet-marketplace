"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { Check, MoreHorizontal, Plus, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function AdminReviewsPage() {
    const utils = trpc.useUtils();
    const [createOpen, setCreateOpen] = useState(false);
    const [draft, setDraft] = useState({
        productId: "",
        variantId: "",
        authorName: "",
        rating: 5,
        title: "",
        content: "",
        status: "approved" as "pending" | "approved" | "rejected",
        verified: true,
    });

    const { data: reviews, isLoading } =
        trpc.general.customerReviews.getAllReviews.useQuery({});
    const { data: reviewProducts = [] } =
        trpc.general.customerReviews.getReviewProducts.useQuery();
    const selectedProduct = useMemo(
        () => reviewProducts.find((product) => product.id === draft.productId),
        [draft.productId, reviewProducts]
    );

    const updateStatus =
        trpc.general.customerReviews.updateReviewStatus.useMutation({
            onSuccess: () => {
                toast.success("Review status updated");
                utils.general.customerReviews.getAllReviews.invalidate();
            },
            onError: (err) => {
                toast.error("Failed to update review", {
                    description: err.message,
                });
            },
        });

    const deleteReview = trpc.general.customerReviews.deleteReview.useMutation({
        onSuccess: () => {
            toast.success("Review deleted");
            utils.general.customerReviews.getAllReviews.invalidate();
        },
        onError: (err) => {
            toast.error("Failed to delete review", {
                description: err.message,
            });
        },
    });

    const createReview =
        trpc.general.customerReviews.createAdminReview.useMutation({
            onSuccess: () => {
                toast.success("Review created");
                setCreateOpen(false);
                setDraft({
                    productId: "",
                    variantId: "",
                    authorName: "",
                    rating: 5,
                    title: "",
                    content: "",
                    status: "approved",
                    verified: true,
                });
                utils.general.customerReviews.getAllReviews.invalidate();
            },
            onError: (err) => {
                toast.error("Failed to create review", {
                    description: err.message,
                });
            },
        });

    const handleCreateReview = () => {
        if (
            !draft.productId ||
            !draft.authorName ||
            !draft.title ||
            !draft.content
        ) {
            toast.error(
                "Please fill product, author, title and review content."
            );
            return;
        }

        createReview.mutate({
            ...draft,
            variantId: draft.variantId || undefined,
            images: [],
            attributes: [],
        });
    };

    return (
        <div className="flex w-full flex-col gap-6 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                        Product Reviews
                    </h1>
                    <p className="text-sm text-neutral-500">
                        Manage, create and moderate customer reviews across the
                        marketplace.
                    </p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="size-4" />
                            Create Review
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-[650px] overflow-y-auto overflow-x-hidden">
                        <DialogHeader>
                            <DialogTitle>Create Review</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <label className="grid gap-2 text-sm font-medium">
                                Product
                                <select
                                    value={draft.productId}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            productId: event.target.value,
                                            variantId: "",
                                        }))
                                    }
                                    className="h-10 w-full min-w-0 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                                >
                                    <option value="">Select product</option>
                                    {reviewProducts.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-2 text-sm font-medium">
                                Variant suggestion
                                <select
                                    value={draft.variantId}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            variantId: event.target.value,
                                        }))
                                    }
                                    className="h-10 w-full min-w-0 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                                    disabled={!selectedProduct?.variants.length}
                                >
                                    <option value="">
                                        No variant / Product level
                                    </option>
                                    {selectedProduct?.variants.map(
                                        (variant) => (
                                            <option
                                                key={variant.id}
                                                value={variant.id}
                                            >
                                                {variant.label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium">
                                    Author name
                                    <Input
                                        value={draft.authorName}
                                        onChange={(event) =>
                                            setDraft((current) => ({
                                                ...current,
                                                authorName: event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-medium">
                                    Rating
                                    <select
                                        value={draft.rating}
                                        onChange={(event) =>
                                            setDraft((current) => ({
                                                ...current,
                                                rating: Number(
                                                    event.target.value
                                                ),
                                            }))
                                        }
                                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                                    >
                                        {[5, 4, 3, 2, 1].map((rating) => (
                                            <option key={rating} value={rating}>
                                                {rating} star
                                                {rating === 1 ? "" : "s"}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="grid gap-2 text-sm font-medium">
                                Title
                                <Input
                                    value={draft.title}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-medium">
                                Review
                                <Textarea
                                    value={draft.content}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            content: event.target.value,
                                        }))
                                    }
                                    className="min-h-28"
                                />
                            </label>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium">
                                    Status
                                    <select
                                        value={draft.status}
                                        onChange={(event) =>
                                            setDraft((current) => ({
                                                ...current,
                                                status: event.target
                                                    .value as typeof draft.status,
                                            }))
                                        }
                                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                                    >
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">
                                            Rejected
                                        </option>
                                    </select>
                                </label>
                                <label className="flex items-center gap-2 pt-7 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={draft.verified}
                                        onChange={(event) =>
                                            setDraft((current) => ({
                                                ...current,
                                                verified: event.target.checked,
                                            }))
                                        }
                                    />
                                    Mark as verified
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCreateReview}
                                    disabled={createReview.isPending}
                                >
                                    {createReview.isPending
                                        ? "Creating..."
                                        : "Create Review"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-neutral-200 bg-white">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="border-neutral-200 [&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-neutral-100/50">
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                                    Date
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                                    Product
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                                    Rating
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                                    Review
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                                    Status
                                </th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-neutral-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="h-24 text-center"
                                    >
                                        Loading reviews...
                                    </td>
                                </tr>
                            ) : reviews?.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="h-24 text-center text-neutral-500"
                                    >
                                        No reviews found.
                                    </td>
                                </tr>
                            ) : (
                                reviews?.map((review) => (
                                    <tr
                                        key={review.id}
                                        className="border-b border-neutral-200 transition-colors hover:bg-neutral-50"
                                    >
                                        <td className="whitespace-nowrap p-4 align-middle">
                                            {format(
                                                new Date(review.createdAt),
                                                "MMM d, yyyy"
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="line-clamp-1 font-medium text-neutral-900">
                                                    {review.product?.title ||
                                                        "Unknown Product"}
                                                </span>
                                                <span className="text-xs text-neutral-500">
                                                    {review.authorName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`size-3 ${star <= review.rating ? "fill-neutral-900 text-neutral-900" : "fill-transparent text-neutral-300"}`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="max-w-[300px] p-4 align-middle">
                                            <div className="flex flex-col gap-1">
                                                <span className="line-clamp-1 text-sm font-semibold text-neutral-900">
                                                    {review.title}
                                                </span>
                                                <p className="line-clamp-2 text-xs text-neutral-600">
                                                    {review.content}
                                                </p>
                                                {review.images &&
                                                    review.images.length >
                                                        0 && (
                                                        <div className="mt-1 flex gap-1">
                                                            {review.images.map(
                                                                (img, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="relative h-8 w-8 overflow-hidden rounded"
                                                                    >
                                                                        <Image
                                                                            src={
                                                                                img
                                                                            }
                                                                            alt="img"
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge
                                                variant={
                                                    review.status === "approved"
                                                        ? "default"
                                                        : review.status ===
                                                            "rejected"
                                                          ? "destructive"
                                                          : "secondary"
                                                }
                                            >
                                                {review.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right align-middle">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <span className="sr-only">
                                                            Open menu
                                                        </span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {review.status !==
                                                        "approved" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                updateStatus.mutate(
                                                                    {
                                                                        id: review.id,
                                                                        status: "approved",
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <Check className="mr-2 h-4 w-4 text-green-600" />
                                                            <span>Approve</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {review.status !==
                                                        "rejected" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                updateStatus.mutate(
                                                                    {
                                                                        id: review.id,
                                                                        status: "rejected",
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <X className="mr-2 h-4 w-4 text-red-600" />
                                                            <span>Reject</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    "Are you sure you want to delete this review?"
                                                                )
                                                            ) {
                                                                deleteReview.mutate(
                                                                    {
                                                                        id: review.id,
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
