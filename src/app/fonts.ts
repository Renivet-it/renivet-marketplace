import { DM_Sans, Lato, Rubik } from "next/font/google";

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