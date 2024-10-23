import { EB_Garamond, Inter } from "next/font/google";

export const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "600", "800"],
    display: "swap",
    variable: "--font-inter",
});

export const garamond = EB_Garamond({
    subsets: ["latin"],
    weight: ["400", "600", "800"],
    display: "swap",
    variable: "--font-garamond",
});
