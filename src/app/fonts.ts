import {
    DM_Sans,
    Josefin_Sans,
    Lato,
    Playfair_Display,
    Rubik,
} from "next/font/google";

export const dmsans = DM_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "800"],
    display: "swap",
    variable: "--font-dmsans",
});

export const rubik = Rubik({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
    variable: "--font-rubik",
});

export const lato = Lato({
    subsets: ["latin"],
    weight: ["300", "400", "700", "900"], // Choose the weights you need
    display: "swap",
    variable: "--font-lato", // Define the CSS variable
});

export const josefin = Josefin_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"], // choose what you need
    display: "swap",
    variable: "--font-josefin",
});

export const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-playfair",
});
