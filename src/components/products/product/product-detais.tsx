import { cn } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { FileText } from "lucide-react";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
}
export function ProductDetails({ className, product, ...props }: PageProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <div className="product-details">
                <div className="description-heading flex gap-[5px]">
                    <h4 className="uppercas text-16 font-bold text-myntra-primary">
                        Product Details
                    </h4>
                    <FileText className="size-5 text-myntra-primary" />
                </div>
                <ul className="pt-3 text-16 leading-[1.4] text-myntra-primary text-opacity-90">
                    <li>Olive brown T-shirt for men</li>
                    <li>Olive brown T-shirt for men</li>
                    <li>Olive brown T-shirt for men</li>
                    <li>Olive brown T-shirt for men</li>
                    <li>Olive brown T-shirt for men</li>
                    <li>Olive brown T-shirt for men</li>
                </ul>
            </div>
            <div className="disclaimer-section">
                <h4 className="pb-[5px] text-16 font-bold leading-[1.4] text-myntra-primary">
                    Disclaimer
                </h4>
                <p className="text-16 leading-[1.4] text-myntra-primary text-opacity-90">
                    This is a unisex T-shirt, shot on men
                </p>
            </div>
            <div className="size-fit-section">
                <h4 className="pb-[5px] text-16 font-bold leading-[1.4] text-myntra-primary">
                    Size & Fit
                </h4>
                <ul className="text-16 leading-[1.4] text-myntra-primary text-opacity-90">
                    <li>Relaxed Fit</li>
                    <li>The model height 6 inch is wearing a size M</li>
                </ul>
            </div>
            <div className="material-section">
                <h4 className="pb-[5px] text-16 font-bold leading-[1.4] text-myntra-primary">
                    Material & Care
                </h4>
                <ul className="text-16 leading-[1.4] text-myntra-primary text-opacity-90">
                    <li>100% Cotton</li>
                    <li>TMachine Wash</li>
                </ul>
            </div>
            <div className="specification-section">
                <h4 className="pb-[5px] text-16 font-bold leading-[1.4] text-myntra-primary">
                    Specifications
                </h4>
                <div className="spec-list grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-x-[10%]">
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                            Fabric
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                            Pure Cotton
                        </p>
                    </div>
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                        Fit
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                        Relaxed Fit
                        </p>
                    </div>
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                        Length
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                        Regular
                        </p>
                    </div>
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                        Main Trend
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                        New Basics
                        </p>
                    </div>
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                        Multipack Set
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                        Single
                        </p>
                    </div>
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                        Neck
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                        Round Neck
                        </p>
                    </div>
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                        Net Quantity Unit
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                        Piece
                        </p>
                    </div>
                    <div className="spec-item border-b-[1px] border-[#eaeaec] pb-[10px]">
                        <label className="text-myntra-label text-12 pb-[5px] capitalize leading-[1]">
                        Number of Items
                        </label>
                        <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                            1
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
