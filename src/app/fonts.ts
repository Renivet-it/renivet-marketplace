import { EB_Garamond, Poppins } from "next/font/google";

export const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "600", "800"],
    display: "swap",
    variable: "--font-poppins",
});

export const garamond = EB_Garamond({
    subsets: ["latin"],
    weight: ["400", "600", "800"],
    display: "swap",
    variable: "--font-garamond",
});
