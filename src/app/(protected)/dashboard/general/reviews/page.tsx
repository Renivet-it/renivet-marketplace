"use client";

import { GenericProps } from "@/types";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { Star, MoreHorizontal, Check, X, Trash2 } from "lucide-react";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminReviewsPage({}: GenericProps) {
    const utils = trpc.useUtils();
    
    const { data: reviews, isLoading } = trpc.general.customerReviews.getAllReviews.useQuery({});
    
    const updateStatus = trpc.general.customerReviews.updateReviewStatus.useMutation({
        onSuccess: () => {
            toast.success("Review status updated");
            utils.general.customerReviews.getAllReviews.invalidate();
        },
        onError: (err) => {
            toast.error("Failed to update review", { description: err.message });
        }
    });

    const deleteReview = trpc.general.customerReviews.deleteReview.useMutation({
        onSuccess: () => {
            toast.success("Review deleted");
            utils.general.customerReviews.getAllReviews.invalidate();
        },
        onError: (err) => {
            toast.error("Failed to delete review", { description: err.message });
        }
    });

    return (
        <div className="flex w-full flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    Product Reviews
                </h1>
                <p className="text-sm text-neutral-500">
                    Manage and moderate customer reviews across the marketplace.
                </p>
            </div>

            <div className="rounded-md border border-neutral-200 bg-white">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b border-neutral-200">
                            <tr className="border-b transition-colors hover:bg-neutral-100/50">
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Date</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Product</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Rating</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Review</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Status</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-neutral-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="h-24 text-center">Loading reviews...</td>
                                </tr>
                            ) : reviews?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="h-24 text-center text-neutral-500">No reviews found.</td>
                                </tr>
                            ) : (
                                reviews?.map((review) => (
                                    <tr key={review.id} className="border-b border-neutral-200 transition-colors hover:bg-neutral-50">
                                        <td className="p-4 align-middle whitespace-nowrap">
                                            {format(new Date(review.createdAt), "MMM d, yyyy")}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-neutral-900 line-clamp-1">{review.product?.title || "Unknown Product"}</span>
                                                <span className="text-xs text-neutral-500">{review.authorName}</span>
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
                                        <td className="p-4 align-middle max-w-[300px]">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-neutral-900 text-sm line-clamp-1">{review.title}</span>
                                                <p className="text-xs text-neutral-600 line-clamp-2">{review.content}</p>
                                                {review.images && review.images.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {review.images.map((img, i) => (
                                                            <div key={i} className="relative h-8 w-8 rounded overflow-hidden">
                                                                <Image src={img} alt="img" fill className="object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={review.status === "approved" ? "default" : review.status === "rejected" ? "destructive" : "secondary"}>
                                                {review.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {review.status !== "approved" && (
                                                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: review.id, status: "approved" })}>
                                                            <Check className="mr-2 h-4 w-4 text-green-600" />
                                                            <span>Approve</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {review.status !== "rejected" && (
                                                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: review.id, status: "rejected" })}>
                                                            <X className="mr-2 h-4 w-4 text-red-600" />
                                                            <span>Reject</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => {
                                                            if(confirm("Are you sure you want to delete this review?")) {
                                                                deleteReview.mutate({ id: review.id });
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
