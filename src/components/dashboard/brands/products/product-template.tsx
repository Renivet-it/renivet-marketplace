"use client";

import { Icons } from "@/components/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { unparse } from "papaparse";
import { toast } from "sonner";

export function ProductTemplateButton() {
    const handleDownloadTemplate = () => {
        try {
            const templateData = [
                // Size S - Blue variant
                {
                    "Product Title": "Sample T-Shirt",
                    "Product Description (HTML)":
                        "<p>A comfortable cotton t-shirt</p>",
                    "Meta Title": "Sample T-Shirt | Your Brand",
                    "Meta Description":
                        "High-quality cotton t-shirt available in multiple colors and sizes",
                    "Meta Keywords": "t-shirt, cotton, clothing",
                    "Has Variants": "true",
                    Category: "Men",
                    Subcategory: "Topwear",
                    "Product Type": "T-Shirts",
                    "Specification1 Label": "Fabric",
                    "Specification1 Value": "Cotton",
                    "Specification2 Label": "Length",
                    "Specification2 Value": "Short Kurta",
                    "Specification3 Label": "Neck",
                    "Specification3 Value": "Boat Neck",
                    "Specification4 Label": "Sleeves",
                    "Specification4 Value": "3/4th ",
                    "Size and Fit": "3/4th ",
                    "Material and Care": "3/4th ",
                    "Return (TRUE/FALSE)": "TRUE",
                    "Return Policy Description(IF yes)": "The item is returnable ",
                    "Replace (TRUE/FALSE)": "TRUE ",
                    "Replace Policy Description(IF yes)": "The item can be replcaed ",
                    "Option1 Name": "Size",
                    "Option1 Value": "S",
                    "Option2 Name": "Color",
                    "Option2 Value": "Blue",
                    "Option3 Name": "",
                    "Option3 Value": "",
                    SKU: "TS-BLU-S",
                    Barcode: "123456789",
                    "Price (in Rupees)": "1999",
                    "Compare At Price (in Rupees)": "2499",
                    "Cost Per Item (in Rupees)": "1000",
                    Quantity: "10",
                    "Weight (g)": "200",
                    "Length (cm)": "30",
                    "Width (cm)": "20",
                    "Height (cm)": "2",
                    "Country Code (ISO)": "IN",
                    "HS Code": "610910",
                },
                // Size S - Red variant
                {
                    "Product Title": "Sample T-Shirt",
                    "Specification1 Label": "Fabric",
                    "Specification1 Value": "Cotton",
                    "Specification2 Label": "Length",
                    "Specification2 Value": "Short Kurta",
                    "Specification3 Label": "Neck",
                    "Specification3 Value": "Boat Neck",
                    "Specification4 Label": "Sleeves",
                    "Specification4 Value": "3/4th ",
                    "Size and Fit": "3/4th ",
                    "Material and Care": "3/4th ",
                    "Return (TRUE/FALSE)": "TRUE",
                    "Return Policy Description(IF yes)": "The item is returnable ",
                    "Replace (TRUE/FALSE)": "TRUE ",
                    "Replace Policy Description(IF yes)": "The item can be replcaed ",
                    "Option1 Name": "Size",
                    "Option1 Value": "S",
                    "Option2 Name": "Color",
                    "Option2 Value": "Red",
                    "Option3 Name": "",
                    "Option3 Value": "",
                    SKU: "TS-RED-S",
                    Barcode: "123456792",
                    "Price (in Rupees)": "1999",
                    "Compare At Price (in Rupees)": "2499",
                    "Cost Per Item (in Rupees)": "1000",
                    Quantity: "8",
                    "Weight (g)": "200",
                    "Length (cm)": "30",
                    "Width (cm)": "20",
                    "Height (cm)": "2",
                    "Country Code (ISO)": "IN",
                    "HS Code": "610910",
                },
                // Size M - Blue variant
                {
                    "Product Title": "Sample T-Shirt",
                    "Option1 Name": "Size",
                    "Option1 Value": "M",
                    "Option2 Name": "Color",
                    "Option2 Value": "Blue",
                    "Option3 Name": "",
                    "Option3 Value": "",
                    SKU: "TS-BLU-M",
                    Barcode: "123456790",
                    "Price (in Rupees)": "1999",
                    "Compare At Price (in Rupees)": "2499",
                    "Cost Per Item (in Rupees)": "1000",
                    Quantity: "15",
                    "Weight (g)": "220",
                    "Length (cm)": "32",
                    "Width (cm)": "22",
                    "Height (cm)": "2",
                    "Country Code (ISO)": "IN",
                    "HS Code": "610910",
                },
                // Size M - Red variant
                {
                    "Product Title": "Sample T-Shirt",
                    "Option1 Name": "Size",
                    "Option1 Value": "M",
                    "Option2 Name": "Color",
                    "Option2 Value": "Red",
                    "Option3 Name": "",
                    "Option3 Value": "",
                    SKU: "TS-RED-M",
                    Barcode: "123456793",
                    "Price (in Rupees)": "1999",
                    "Compare At Price (in Rupees)": "2499",
                    "Cost Per Item (in Rupees)": "1000",
                    Quantity: "12",
                    "Weight (g)": "220",
                    "Length (cm)": "32",
                    "Width (cm)": "22",
                    "Height (cm)": "2",
                    "Country Code (ISO)": "IN",
                    "HS Code": "610910",
                },
                // Size L - Blue variant
                {
                    "Product Title": "Sample T-Shirt",
                    "Option1 Name": "Size",
                    "Option1 Value": "L",
                    "Option2 Name": "Color",
                    "Option2 Value": "Blue",
                    "Option3 Name": "",
                    "Option3 Value": "",
                    SKU: "TS-BLU-L",
                    Barcode: "123456791",
                    "Price (in Rupees)": "1999",
                    "Compare At Price (in Rupees)": "2499",
                    "Cost Per Item (in Rupees)": "1000",
                    Quantity: "20",
                    "Weight (g)": "240",
                    "Length (cm)": "34",
                    "Width (cm)": "24",
                    "Height (cm)": "2",
                    "Country Code (ISO)": "IN",
                    "HS Code": "610910",
                },
                // Size L - Red variant
                {
                    "Product Title": "Sample T-Shirt",
                    "Option1 Name": "Size",
                    "Option1 Value": "L",
                    "Option2 Name": "Color",
                    "Option2 Value": "Red",
                    "Option3 Name": "",
                    "Option3 Value": "",
                    SKU: "TS-RED-L",
                    Barcode: "123456794",
                    "Price (in Rupees)": "1999",
                    "Compare At Price (in Rupees)": "2499",
                    "Cost Per Item (in Rupees)": "1000",
                    Quantity: "18",
                    "Weight (g)": "240",
                    "Length (cm)": "34",
                    "Width (cm)": "24",
                    "Height (cm)": "2",
                    "Country Code (ISO)": "IN",
                    "HS Code": "610910",
                },
                // Example 2: Product without variants
                {
                    "Product Title": "Classic Leather Wallet",
                    "Product Description (HTML)":
                        "<p>Genuine leather wallet with multiple card slots</p>",
                    "Meta Title": "Classic Leather Wallet | Your Brand",
                    "Meta Description":
                        "Handcrafted genuine leather wallet with premium finish",
                    "Meta Keywords": "wallet, leather, accessories",
                    "Has Variants": "false", // No variants
                    Category: "Men",
                    Subcategory: "Accessories",
                    "Product Type": "Wallets",
                    // Product level fields (no variants)
                    "Option1 Name": "",
                    "Option1 Value": "",
                    "Option2 Name": "",
                    "Option2 Value": "",
                    "Option3 Name": "",
                    "Option3 Value": "",
                    SKU: "CLW-BRN",
                    Barcode: "987654321",
                    "Price (in Rupees)": "2999",
                    "Compare At Price (in Rupees)": "3499",
                    "Cost Per Item (in Rupees)": "1500",
                    Quantity: "50",
                    "Weight (g)": "150",
                    "Length (cm)": "12",
                    "Width (cm)": "10",
                    "Height (cm)": "2",
                    "Country Code (ISO)": "IN",
                    "HS Code": "420232",
                },
            ];

            const csv = unparse(templateData, {
                quotes: true,
                header: true,
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = [
                "renivet",
                "product",
                "import",
                "template.csv",
            ].join("_");
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            toast.error("Failed to download template");
            console.error(error);
        }
    };

    return (
        <DropdownMenuItem onClick={handleDownloadTemplate}>
            <Icons.FileText className="size-3" />
            Download Template
        </DropdownMenuItem>
    );
}
