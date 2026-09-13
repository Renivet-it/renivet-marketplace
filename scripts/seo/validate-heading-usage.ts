import { readFile } from "node:fs/promises";

type RouteComposition = {
    route: string;
    files: string[];
    dynamicHeading?: {
        component: string;
        declaration: string;
        render: string;
        h1Invocation: string;
    };
};

const footer = "src/components/globals/layouts/footer/footer.tsx";
const routeCompositions: RouteComposition[] = [
    {
        route: "/",
        files: [
            "src/app/(home)/page.tsx",
            "src/app/(home)/layout.tsx",
            footer,
            "src/components/home/new-home-page/discount-section.tsx",
            "src/components/home/new-home-page/everyday-essential.tsx",
            "src/components/home/shop-slow.tsx",
            "src/components/home/women/top-collection.tsx",
            "src/components/home/men/new-collection.tsx",
            "src/components/home/beauty-personal/product-new-arrival.tsx",
        ],
    },
    {
        route: "/shop",
        files: [
            "src/app/(marketing)/shop/page.tsx",
            "src/app/(marketing)/shop/layout.tsx",
            "src/components/shop/storefront-catalog-page.tsx",
            footer,
        ],
    },
    {
        route: "/festive",
        files: [
            "src/app/(home)/festive/page.tsx",
            "src/app/(home)/layout.tsx",
            "src/components/home/new-home-page/festive-season.tsx",
            footer,
        ],
        dynamicHeading: {
            component: "src/components/home/new-home-page/festive-season.tsx",
            declaration: "const Heading = headingLevel;",
            render: "<Heading>{heading}</Heading>",
            h1Invocation: 'headingLevel="h1"',
        },
    },
];

const countLiteralH1s = (source: string) =>
    (source.match(/<h1\b/g) ?? []).length;

for (const composition of routeCompositions) {
    const sources = await Promise.all(
        composition.files.map(async (file) => [file, await readFile(file, "utf8")] as const)
    );
    const sourceByFile = new Map(sources);
    const literalH1s = countLiteralH1s(
        sources.map(([, source]) => source).join("\n")
    );
    const dynamicHeading = composition.dynamicHeading;
    const dynamicH1s = dynamicHeading
        ? (() => {
              const component = sourceByFile.get(dynamicHeading.component);
              const route = sourceByFile.get(composition.files[0]);
              if (
                  !component?.includes(dynamicHeading.declaration) ||
                  !component.includes(dynamicHeading.render) ||
                  !route?.includes(dynamicHeading.h1Invocation)
              ) {
                  throw new Error(
                      `${composition.route} must retain its configured dynamic H1 owner.`
                  );
              }
              return 1;
          })()
        : 0;

    if (literalH1s + dynamicH1s !== 1) {
        throw new Error(
            `${composition.route} must compose exactly one H1; found ${literalH1s} literal and ${dynamicH1s} dynamic owners.`
        );
    }
}

console.log("SEO heading usage is valid.");
