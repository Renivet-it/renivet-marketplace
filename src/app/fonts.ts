import {
    DM_Sans,
    Josefin_Sans,
    Playfair_Display,
    Rubik,
    Work_Sans,
} from "next/font/google";

export const dmsans = DM_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    display: "swap",
    variable: "--font-dmsans",
});

export const worksans = Work_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    display: "swap",
    variable: "--font-work-sans",
});

export const rubik = Rubik({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    display: "swap",
    variable: "--font-rubik",
});

export const josefin = Josefin_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
    variable: "--font-josefin",
});

export const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    display: "swap",
    variable: "--font-playfair",
});
