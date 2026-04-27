"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { trpc } from "@/lib/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
    rating: z.number().min(1, "Please select a rating"),
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    content: z.string().min(10, "Review must be at least 10 characters").max(1000),
    sizePurchased: z.string().optional(),
    fit: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface WriteReviewModalProps {
    productId: string;
}

export function WriteReviewModal({ productId }: WriteReviewModalProps) {
    const [open, setOpen] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [hoveredStar, setHoveredStar] = useState<number>(0);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            title: "",
            content: "",
            sizePurchased: "",
            fit: "",
        },
    });

    const createReview = trpc.general.customerReviews.createReview.useMutation({
        onSuccess: () => {
            toast.success("Review submitted!", {
                description: "Your review is pending approval from our team.",
            });
            form.reset();
            setImages([]);
            setOpen(false);
        },
        onError: (error) => {
            if (error.data?.code === "UNAUTHORIZED") {
                toast.error("Please sign in to write a review.");
            } else {
                toast.error("Failed to submit review", {
                    description: error.message,
                });
            }
        },
    });

    function onSubmit(data: ReviewFormValues) {
        if (data.rating === 0) {
            form.setError("rating", { message: "Please select a rating" });
            return;
        }

        const attributes = [];
        if (data.sizePurchased) attributes.push({ label: "Size Purchased", value: data.sizePurchased });
        if (data.fit) attributes.push({ label: "Fit", value: data.fit });

        createReview.mutate({
            productId,
            rating: data.rating,
            title: data.title,
            content: data.content,
            images,
            attributes,
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800">
                    Write a Review
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="font-sans text-2xl font-semibold text-neutral-900">
                        Write a Review
                    </DialogTitle>
                    <DialogDescription>
                        Share your thoughts about this product with other customers.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        {/* Rating */}
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-neutral-900">Overall Rating *</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() => setHoveredStar(star)}
                                                    onMouseLeave={() => setHoveredStar(0)}
                                                    onClick={() => field.onChange(star)}
                                                    className="p-1 focus:outline-none"
                                                >
                                                    <Star
                                                        className={cn(
                                                            "size-8 transition-all",
                                                            star <= (hoveredStar || field.value)
                                                                ? "fill-neutral-900 text-neutral-900"
                                                                : "fill-transparent text-neutral-300 hover:text-neutral-400"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Title */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-neutral-900">Review Title *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Example: Perfect fit and incredible quality"
                                            {...field}
                                            className="border-neutral-200 focus-visible:ring-neutral-900"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Content */}
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-neutral-900">Review *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us what you think about this product..."
                                            className="min-h-[120px] resize-y border-neutral-200 focus-visible:ring-neutral-900"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="sizePurchased"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-900">Size Purchased</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Medium"
                                                {...field}
                                                className="border-neutral-200 focus-visible:ring-neutral-900"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-900">Fit</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. True to size"
                                                {...field}
                                                className="border-neutral-200 focus-visible:ring-neutral-900"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-3">
                            <FormLabel className="text-neutral-900">Add Photos (Optional)</FormLabel>
                            {images.length > 0 && (
                                <div className="flex flex-wrap gap-3">
                                    {images.map((url, i) => (
                                        <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border border-neutral-200">
                                            <Image src={url} alt="Review upload" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {images.length < 4 && (
                                <UploadButton
                                    endpoint="reviewImageUploader"
                                    onClientUploadComplete={(res) => {
                                        if (res) {
                                            const urls = res.map((r) => r.url);
                                            setImages((prev) => [...prev, ...urls].slice(0, 4));
                                            toast.success("Images uploaded successfully!");
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        toast.error(`Upload failed: ${error.message}`);
                                    }}
                                    appearance={{
                                        button: "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 rounded-full px-4 text-sm font-semibold transition-colors",
                                        allowedContent: "text-neutral-500 text-xs",
                                    }}
                                />
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setOpen(false)}
                                className="rounded-full border-neutral-200 px-6 font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={createReview.isPending}
                                className="rounded-full bg-neutral-900 px-8 font-semibold text-white hover:bg-neutral-800"
                            >
                                {createReview.isPending ? "Submitting..." : "Submit Review"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
