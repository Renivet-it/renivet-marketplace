import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { cn, hasItems } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { Key, useState } from "react";
import ProductSpecification from "./product-specification";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
}

export function ProductDetails({ className, product, ...props }: PageProps) {
    const [showAllSpecifications, setShowAllSpecifications] = useState(false);
    const visibleSpecifications = showAllSpecifications
        ? product.specifications
        : product.specifications?.slice(0, 8);

    return (
        <div className={cn("", className)} {...props}>
            <Accordion
                type="multiple"
                defaultValue={["details"]}
                className="w-full"
            >
                {/* ── Product Details ── */}
                <AccordionItem
                    value="details"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Product Details
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                        <RichTextViewer
                            content={product.description ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                bulletList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                heading:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                            }}
                            editorClasses="pt-1"
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* ── Specifications ── */}
                <AccordionItem
                    value="specifications"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Specs &amp; Features
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                        <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-x-10">
                            {hasItems(visibleSpecifications) &&
                                visibleSpecifications.map(
                                    (
                                        specification: Record<string, string>,
                                        idx: Key
                                    ) => (
                                        <ProductSpecification
                                            key={idx}
                                            specification={specification}
                                        />
                                    )
                                )}
                        </div>
                        {hasItems(product.specifications) &&
                            product.specifications.length > 8 && (
                                <div className="mt-4 text-left">
                                    <button
                                        onClick={() =>
                                            setShowAllSpecifications(
                                                !showAllSpecifications
                                            )
                                        }
                                        className="cursor-pointer text-[13px] font-semibold uppercase tracking-[0.08em] text-neutral-900 underline underline-offset-4 hover:text-neutral-600 transition-colors"
                                    >
                                        {showAllSpecifications
                                            ? "See Less"
                                            : "See More"}
                                    </button>
                                </div>
                            )}
                    </AccordionContent>
                </AccordionItem>

                {/* ── Material & Care ── */}
                <AccordionItem
                    value="material-care"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Materials &amp; Care
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                        <RichTextViewer
                            content={product.materialAndCare ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                bulletList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                heading:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                            }}
                            editorClasses="pt-1"
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* ── Fit ── */}
                <AccordionItem
                    value="fit"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Fit
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                        <RichTextViewer
                            content={product.sizeAndFit ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                bulletList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                heading:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                            }}
                            editorClasses="pt-1"
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* ── Returns & Exchange ── */}
                <AccordionItem
                    value="return-exchange"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Returns &amp; Exchange
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                        <div className="space-y-5">
                            <div>
                                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">
                                    Return Policy
                                </span>
                                <RichTextViewer
                                    content={
                                        product.returnExchangePolicy
                                            ?.returnDescription ??
                                        "<p>This item is not returnable</p>"
                                    }
                                    customClasses={{
                                        orderedList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        bulletList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        heading:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                    }}
                                    editorClasses="pt-1"
                                />
                            </div>
                            <div>
                                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">
                                    Exchange Policy
                                </span>
                                <RichTextViewer
                                    content={
                                        product.returnExchangePolicy
                                            ?.exchangeDescription ??
                                        "<p>This item is not exchangeable</p>"
                                    }
                                    customClasses={{
                                        orderedList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        bulletList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        heading:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                    }}
                                    editorClasses="pt-1"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
