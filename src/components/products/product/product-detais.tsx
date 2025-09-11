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
        <div className={cn("space-y-3", className)}>
            <Accordion type="single" collapsible className="w-full">
                {/* Product Details */}
                <AccordionItem value="details">
                    <AccordionTrigger className="text-lg py-6 font-bold hover:no-underline mt-4">
                        Product Details
                    </AccordionTrigger>
                    <AccordionContent>
                        <RichTextViewer
                            content={product.description ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-base leading-[1.7] text-myntra-primary text-opacity-90",
                                bulletList:
                                    "text-base leading-[1.7] text-myntra-primary text-opacity-90",
                                heading:
                                    "text-base leading-[1.7] text-myntra-primary text-opacity-90",
                            }}
                            editorClasses="pt-3"
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* Material & Care */}
                <AccordionItem value="material-care">
                    <AccordionTrigger className="text-lg py-6 font-bold hover:no-underline mt-4">
                        Material & Care
                    </AccordionTrigger>
                    <AccordionContent>
                        <RichTextViewer
                            content={product.materialAndCare ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-base leading-[1.7] text-myntra-primary text-opacity-90",
                                bulletList:
                                    "text-base leading-[1.7] text-myntra-primary text-opacity-90",
                                heading:
                                    "text-base leading-[1.7] text-myntra-primary text-opacity-90",
                            }}
                            editorClasses="pt-3"
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* Specifications */}
                <AccordionItem value="specifications">
                    <AccordionTrigger className="text-lg py-6 font-bold hover:no-underline mt-4">
                        Specifications
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="spec-list grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-x-[10%]">
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
                                        className="text-base text-accent cursor-pointer font-bold capitalize"
                                    >
                                        {showAllSpecifications
                                            ? "See Less"
                                            : "See More"}
                                    </button>
                                </div>
                            )}
                    </AccordionContent>
                </AccordionItem>

                {/* Return & Exchange */}
                <AccordionItem value="return-exchange">
                    <AccordionTrigger className="text-lg py-6 font-bold hover:no-underline mt-4">
                        Return & Exchange
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-5">
                            <div>
                                <span className="font-bold block text-base">
                                    Return
                                </span>
                                <RichTextViewer
                                    content={
                                        product.returnExchangePolicy?.returnDescription ??
                                        "<p>This item is not returnable</p>"
                                    }
                                    customClasses={{
                                        orderedList:
                                            "text-base leading-[1.7] text-[#2F2F2F]",
                                        bulletList:
                                            "text-base leading-[1.7] text-[#2F2F2F]",
                                        heading:
                                            "text-base leading-[1.7] text-[#2F2F2F]",
                                    }}
                                    editorClasses="pt-2"
                                />
                            </div>
                            <div>
                                <span className="font-bold block text-base">
                                    Exchange
                                </span>
                                <RichTextViewer
                                    content={
                                        product.returnExchangePolicy?.exchangeDescription ??
                                        "<p>This item is not exchangeable</p>"
                                    }
                                    customClasses={{
                                        orderedList:
                                            "text-base leading-[1.7] text-[#2F2F2F]",
                                        bulletList:
                                            "text-base leading-[1.7] text-[#2F2F2F]",
                                        heading:
                                            "text-base leading-[1.7] text-[#2F2F2F]",
                                    }}
                                    editorClasses="pt-2"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
