import { readFile } from "node:fs/promises";

const sectionFiles = [
    "src/components/home/new-home-page/discount-section.tsx",
    "src/components/home/new-home-page/everyday-essential.tsx",
    "src/components/home/shop-slow.tsx",
    "src/components/home/women/top-collection.tsx",
    "src/components/home/men/new-collection.tsx",
    "src/components/home/beauty-personal/product-new-arrival.tsx",
];

const home = await readFile("src/app/(home)/page.tsx", "utf8");
if ((home.match(/<h1\b/g) ?? []).length !== 1) {
    throw new Error("Homepage must contain exactly one root H1.");
}

for (const file of sectionFiles) {
    const source = await readFile(file, "utf8");
    if (/<h1\b/.test(source)) {
        throw new Error(`Section contains a bare H1: ${file}`);
    }
}

console.log("SEO heading usage is valid.");
