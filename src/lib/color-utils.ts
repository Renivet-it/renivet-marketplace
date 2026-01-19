import convert from "color-convert";
import parse from "color-parse";
// @ts-ignore
import colornames from "colornames";
import { findBestMatch } from "string-similarity";

// RGBA to HEX
function rgbaToHex(rgba: number[]): string {
    const toHex = (c: number) => c.toString(16).padStart(2, "0");
    return `#${toHex(rgba[0])}${toHex(rgba[1])}${toHex(rgba[2])}`;
}

// --- All CSS Named Colors ---
export const ALL_COLORS: Record<string, string> = {
    // Standard CSS Colors
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    black: "#000000",
    blue: "#0000ff",
    brown: "#a52a2a",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkgrey: "#a9a9a9",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgray: "#d3d3d3",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370db",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#db7093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32",

    // Custom Fashion & Textile Colors
    ashbrown: "#9a8b7c",
    babypink: "#f4c2c2",
    bamboogreen: "#8fb13b",
    bamboogreytiedye: "#a0a4a7",
    bamboopinktiedye: "#f1d4d4",
    blushingpeach: "#fcc6b4",
    bottlegreen: "#006a4e",
    braziliansand: "#c3b091",
    brightwhite: "#fdfdfd",
    burgundy: "#800020",
    burntrusset: "#7d3221",
    cannolicream: "#f0ebe1",
    denim: "#1560bd",
    mustard: "#e1ad01",
    navyblue: "#000080",
    olivegrey: "#7a7a61",
    offwhite: "#faf9f6",
    sagegreen: "#9c9f84",
    terracotta: "#e2725b",
    wine: "#722f37",
    charcoal: "#36454f",
    mauve: "#e0b0ff",
    rust: "#b7410e",
    tealblue: "#367588",
    emerald: "#50c878",
    marigold: "#eaa221",
    lavendergrey: "#c4c3d0",
    khakigreen: "#8a865d",
    creampuff: "#fffdd0",
    dustypink: "#dcae96",
    mint: "#98ff98",
    blush: "#de5d83",
    camel: "#c19a6b",
    tanbrown: "#91672c",
    mochabrown: "#a38068",
    midnight: "#2c3e50",
    forest: "#228b22",
    oatmeal: "#dfd7d2",
    sand: "#c2b280",
    stone: "#a19b91",
    slate: "#708090",
    lilac: "#c8a2c8",
    peachesncream: "#f9e0b1",
};

// Helper to adjust hex color (lightness/saturation)
function adjustColor(hex: string, modifiers: string[]): string {
    try {
        const [h, s, l] = convert.hex.hsl(hex);
        let newS = s;
        let newL = l;

        if (Array.isArray(modifiers)) {
            for (const mod of modifiers) {
                switch (mod) {
                    case "light":
                    case "pale":
                    case "soft":
                    case "pastel":
                    case "sky":
                        newL = Math.min(newL + 20, 95);
                        break;
                    case "dark":
                    case "deep":
                    case "midnight":
                    case "forest":
                        newL = Math.max(newL - 20, 5);
                        break;
                    case "bright":
                    case "vivid":
                    case "neon":
                        newS = Math.min(newS + 30, 100);
                        break;
                    case "muted":
                    case "dusty":
                    case "ash":
                    case "smoked":
                        newS = Math.max(newS - 30, 10);
                        newL = Math.min(Math.max(newL, 30), 70);
                        break;
                }
            }
        }

        return `#${convert.hsl.hex([h, newS, newL])}`;
    } catch {
        return hex;
    }
}

// Master list of known color names for fuzzy matching
const KNOWN_COLOR_NAMES = Object.keys(ALL_COLORS);

/**
 * Get hex color code from a color name.
 * Handles complex color names like "Bamboo Grey Tiedye", "Light Blue", etc.
 */
export const getColorHex = (colorName: string): string => {
    if (!colorName) return "#CCCCCC";

    const normalized = colorName.toLowerCase().trim();
    const words = normalized.split(/[\s&_-]+/);

    // 1. Exact Match (cleaned)
    const cleaned = normalized.replace(/[\s&_-]+/g, "");
    if (ALL_COLORS[cleaned]) return ALL_COLORS[cleaned];

    // 2. Colornames Library Lookup
    const libColor = colornames(normalized);
    if (libColor) return libColor;

    // 3. Modifier-based Heuristic
    const modifiersList = [
        "light",
        "dark",
        "pale",
        "deep",
        "soft",
        "bright",
        "vivid",
        "muted",
        "dusty",
        "ash",
        "sky",
        "midnight",
        "forest",
        "neon",
        "pastel",
        "smoked",
    ];
    const foundModifiers = words.filter((w) => modifiersList.includes(w));
    const potentialBaseColors = words.filter((w) => !modifiersList.includes(w));

    // Try to find a base color in our list or colornames
    for (const base of potentialBaseColors) {
        const baseHex = ALL_COLORS[base] || colornames(base);
        if (baseHex) {
            return adjustColor(baseHex, foundModifiers);
        }
    }

    // 4. Fuzzy Matching
    try {
        const matches = findBestMatch(cleaned, KNOWN_COLOR_NAMES);
        if (matches.bestMatch.rating > 0.6) {
            return ALL_COLORS[matches.bestMatch.target];
        }
    } catch {}

    // 5. Word-by-word fallback
    for (const word of words) {
        if (ALL_COLORS[word]) return ALL_COLORS[word];
        const wordLib = colornames(word);
        if (wordLib) return wordLib;
    }

    // 6. Check color-parse as a last attempt
    try {
        const parsed = parse(colorName);
        if (parsed.space) return rgbaToHex(parsed.values);
    } catch {}

    // 7. Stable neutral fallback
    return "#E5E5E5";
};

/**
 * Get checkmark color (black or white) based on background luminance.
 */
export const getCheckmarkColor = (hex: string): string => {
    if (!hex || hex.length !== 7) return "black";
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5 ? "white" : "black";
};

// --- Main Color Categories (like Myntra) ---
// COMPREHENSIVE FASHION INDUSTRY COLOR VOCABULARY
export const MAIN_COLOR_CATEGORIES: {
    name: string;
    hex: string;
    keywords: string[];
}[] = [
    {
        name: "Black",
        hex: "#000000",
        keywords: [
            "black",
            "charcoal",
            "ebony",
            "jet",
            "onyx",
            "raven",
            "obsidian",
            "noir",
            "coal",
            "soot",
            "ink",
            "pitch",
            "carbon",
            "graphite",
            "anthracite",
            "licorice",
            "caviar",
            "nero",
        ],
    },
    {
        name: "White",
        hex: "#FFFFFF",
        keywords: [
            "white",
            "ivory",
            "cream",
            "off-white",
            "offwhite",
            "snow",
            "pearl",
            "alabaster",
            "chalk",
            "milk",
            "vanilla",
            "coconut",
            "eggshell",
            "bone",
            "linen",
            "cotton",
            "porcelain",
            "frost",
            "winter white",
            "bright white",
            "pure white",
            "snow white",
            "ghost",
            "crystal",
            "blanc",
            "bianco",
        ],
    },
    {
        name: "Grey",
        hex: "#808080",
        keywords: [
            "grey",
            "gray",
            "silver",
            "ash",
            "slate",
            "stone",
            "smoke",
            "pewter",
            "steel",
            "iron",
            "cement",
            "concrete",
            "fog",
            "mist",
            "dove",
            "heather",
            "gunmetal",
            "titanium",
            "platinum",
            "nickel",
            "lead",
            "mouse",
            "elephant",
            "thunder",
            "storm",
            "cloud",
            "grigio",
        ],
    },
    {
        name: "Navy",
        hex: "#000080",
        keywords: [
            "navy",
            "navy blue",
            "midnight blue",
            "dark blue",
            "nautical",
            "admiral",
            "marine",
            "sailor",
            "oxford blue",
            "prussian",
            "deep blue",
        ],
    },
    {
        name: "Blue",
        hex: "#0066CC",
        keywords: [
            "blue",
            "azure",
            "cobalt",
            "cyan",
            "denim",
            "indigo",
            "cerulean",
            "sapphire",
            "sky",
            "ocean",
            "sea",
            "aqua",
            "turquoise",
            "teal",
            "powder",
            "royal",
            "electric",
            "periwinkle",
            "cornflower",
            "baby blue",
            "ice blue",
            "steel blue",
            "peacock",
            "aegean",
            "caribbean",
            "pacific",
            "atlantic",
            "capri",
            "topaz",
            "lapis",
            "bluebell",
            "hydrangea",
            "iris",
            "wave",
            "surf",
            "lagoon",
            "azzurro",
        ],
    },
    {
        name: "Green",
        hex: "#228B22",
        keywords: [
            "green",
            "emerald",
            "forest",
            "lime",
            "mint",
            "olive",
            "sage",
            "khaki",
            "bamboo",
            "bottle",
            "hunter",
            "jade",
            "moss",
            "pine",
            "fern",
            "leaf",
            "grass",
            "apple",
            "chartreuse",
            "pistachio",
            "avocado",
            "pickle",
            "cucumber",
            "artichoke",
            "basil",
            "herb",
            "eucalyptus",
            "jungle",
            "amazon",
            "shamrock",
            "clover",
            "kelly",
            "spring",
            "tea",
            "matcha",
            "pear",
            "kiwi",
            "cactus",
            "succulent",
            "aloe",
            "olive drab",
            "army",
            "military",
            "seafoam",
            "verde",
        ],
    },
    {
        name: "Red",
        hex: "#FF0000",
        keywords: [
            "red",
            "crimson",
            "scarlet",
            "cherry",
            "ruby",
            "vermilion",
            "tomato",
            "poppy",
            "cardinal",
            "brick",
            "apple red",
            "candy",
            "fire",
            "flame",
            "blood",
            "rose red",
            "lipstick",
            "rouge",
            "garnet",
            "currant",
            "cranberry",
            "raspberry",
            "strawberry",
            "watermelon",
            "hibiscus",
            "carnation",
            "valentine",
            "heart",
            "chili",
            "pepper",
            "paprika",
            "cayenne",
            "lobster",
            "crab",
            "ferrari",
            "racing red",
            "rosso",
        ],
    },
    {
        name: "Maroon",
        hex: "#800000",
        keywords: [
            "maroon",
            "burgundy",
            "wine",
            "oxblood",
            "bordeaux",
            "merlot",
            "cabernet",
            "claret",
            "sangria",
            "mulberry",
            "berry",
            "dark red",
            "deep red",
            "mahogany",
            "raisin",
            "prune",
            "aubergine",
            "beet",
            "jam",
            "port",
            "shiraz",
            "brandy",
            "cordovan",
        ],
    },
    {
        name: "Pink",
        hex: "#FFC0CB",
        keywords: [
            "pink",
            "rose",
            "blush",
            "coral",
            "salmon",
            "fuchsia",
            "magenta",
            "dusty pink",
            "baby pink",
            "hot pink",
            "bubblegum",
            "candy pink",
            "flamingo",
            "carnation",
            "peony",
            "cherry blossom",
            "sakura",
            "ballet",
            "ballerina",
            "princess",
            "barbie",
            "neon pink",
            "millennial pink",
            "nude pink",
            "mauve pink",
            "champagne pink",
            "shell",
            "powder pink",
            "rose gold",
            "petal",
            "orchid pink",
            "watermelon pink",
            "guava",
            "dragonfruit",
            "taffy",
            "cotton candy",
            "rosa",
        ],
    },
    {
        name: "Purple",
        hex: "#800080",
        keywords: [
            "purple",
            "violet",
            "lavender",
            "lilac",
            "mauve",
            "orchid",
            "grape",
            "plum purple",
            "amethyst",
            "eggplant",
            "wisteria",
            "heliotrope",
            "iris purple",
            "periwinkle purple",
            "boysenberry",
            "jam purple",
            "wine purple",
            "royal purple",
            "imperial",
            "regal",
            "velvet purple",
            "deep purple",
            "ultra violet",
            "magenta purple",
            "byzantium",
            "tyrian",
            "mulberry purple",
            "viola",
        ],
    },
    {
        name: "Orange",
        hex: "#FFA500",
        keywords: [
            "orange",
            "tangerine",
            "rust",
            "terracotta",
            "apricot",
            "amber",
            "carrot",
            "pumpkin",
            "squash",
            "mango",
            "papaya",
            "persimmon",
            "clementine",
            "mandarin",
            "sunset",
            "burnt orange",
            "copper",
            "cinnamon",
            "ginger",
            "spice",
            "marigold orange",
            "tiger",
            "fox",
            "autumn",
            "fall",
            "harvest",
            "cantaloupe",
            "nectarine",
            "turmeric",
            "saffron",
            "curry",
            "arancio",
        ],
    },
    {
        name: "Yellow",
        hex: "#FFFF00",
        keywords: [
            "yellow",
            "gold",
            "mustard",
            "lemon",
            "canary",
            "marigold",
            "amber yellow",
            "buttercup",
            "daffodil",
            "sunflower",
            "banana",
            "honey",
            "butter",
            "corn",
            "curry yellow",
            "ochre",
            "goldenrod",
            "champagne",
            "blonde",
            "wheat",
            "straw",
            "flax",
            "saffron yellow",
            "taxi",
            "school bus",
            "caution",
            "neon yellow",
            "fluorescent",
            "highlighter",
            "electric yellow",
            "sunshine",
            "sunny",
            "golden",
            "aureolin",
            "citrine",
            "giallo",
        ],
    },
    {
        name: "Brown",
        hex: "#8B4513",
        keywords: [
            "brown",
            "tan",
            "chocolate",
            "coffee",
            "mocha",
            "chestnut",
            "camel",
            "bronze",
            "copper",
            "sienna",
            "umber",
            "walnut",
            "mahogany brown",
            "espresso",
            "cocoa",
            "hazelnut",
            "almond",
            "cinnamon brown",
            "ginger brown",
            "toffee",
            "caramel",
            "butterscotch",
            "peanut",
            "hickory",
            "maple",
            "oak",
            "teak",
            "cedar",
            "wood",
            "timber",
            "bark",
            "earth",
            "soil",
            "mud",
            "clay",
            "rust brown",
            "tobacco",
            "cognac",
            "whiskey",
            "saddle",
            "leather",
            "suede",
            "biscuit",
            "cookie",
            "fawn",
            "deer",
            "choco",
            "marrone",
        ],
    },
    {
        name: "Beige",
        hex: "#F5F5DC",
        keywords: [
            "beige",
            "sand",
            "nude",
            "oatmeal",
            "taupe",
            "fawn",
            "ecru",
            "buff",
            "camel light",
            "wheat light",
            "natural",
            "pebble",
            "mushroom",
            "putty",
            "latte",
            "cappuccino",
            "cashew",
            "macadamia",
            "sesame",
            "flax beige",
            "canvas",
            "hemp",
            "jute",
            "burlap",
            "raffia",
            "rattan",
            "wicker",
            "bamboo beige",
            "desert",
            "dune",
            "sahara",
            "caramel light",
            "biscotti",
            "creme",
        ],
    },
    {
        name: "Peach",
        hex: "#FFCBA4",
        keywords: [
            "peach",
            "apricot light",
            "peachy",
            "peach pink",
            "peach orange",
            "coral peach",
            "melon",
            "cantaloupe light",
            "flesh",
            "skin",
            "peaches and cream",
            "peach blush",
            "peach fuzz",
            "pesca",
        ],
    },
    {
        name: "Multi",
        hex: "#GRADIENT",
        keywords: [
            "multi",
            "multicolor",
            "rainbow",
            "tie-dye",
            "tiedye",
            "printed",
            "pattern",
            "abstract",
            "floral print",
            "animal print",
            "geometric",
            "paisley",
            "polka",
            "stripe",
            "check",
            "plaid",
            "tartan",
            "camouflage",
            "camo",
            "tropical",
            "ombre",
            "gradient",
            "colorblock",
            "mixed",
            "assorted",
            "various",
            "combo",
            "combination",
        ],
    },
];

/**
 * ULTIMATE FUTURE-PROOF COLOR CATEGORIZATION
 * Maps any color name to its main category using multiple techniques:
 * 1. Multi-color pattern detection (& / and / print / stripe / pattern)
 * 2. Keyword matching against comprehensive color vocabulary
 * 3. Hex-based HSL color analysis (for completely unknown colors)
 * 4. Fallback to "Multi" for truly unidentifiable colors
 */
export const getMainColorCategory = (colorName: string): string => {
    if (!colorName) return "Multi";

    const normalized = colorName.toLowerCase().trim();

    // 1. MULTI-COLOR DETECTION - Check for patterns indicating multiple colors
    const multiPatterns = [
        /\s*&\s*/, // "Blue & White"
        /\s+and\s+/i, // "Blue and White"
        /\s*\/\s*/, // "Blue/White"
        /\s+with\s+/i, // "Blue with White"
        /\s+on\s+/i, // "Blue on White"
        /-\w+-\w+/, // "Blue-White-Pink" (3+ parts)
    ];

    if (multiPatterns.some((pattern) => pattern.test(normalized))) {
        return "Multi";
    }

    // Check for explicit multi-color keywords
    const multiKeywords = [
        "multi",
        "rainbow",
        "tie-dye",
        "tiedye",
        "printed",
        "print",
        "pattern",
        "floral",
        "abstract",
        "geometric",
        "stripe",
        "striped",
        "check",
        "checked",
        "plaid",
        "tartan",
        "polka",
        "dot",
        "spots",
        "ombre",
        "gradient",
        "colorblock",
        "mixed",
        "animal print",
        "leopard",
        "zebra",
        "camo",
        "camouflage",
        "tropical",
    ];

    if (multiKeywords.some((kw) => normalized.includes(kw))) {
        return "Multi";
    }

    // 2. KEYWORD MATCHING - Check against all categories
    for (const category of MAIN_COLOR_CATEGORIES) {
        for (const keyword of category.keywords) {
            if (normalized.includes(keyword.toLowerCase())) {
                return category.name;
            }
        }
    }

    // 3. HEX-BASED COLOR ANALYSIS - Analyze actual color for unknown names
    try {
        const hex = getColorHex(colorName);
        if (hex && hex !== "#E5E5E5" && hex !== "#CCCCCC") {
            // Parse hex to RGB
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);

            // Convert to HSL
            const rNorm = r / 255;
            const gNorm = g / 255;
            const bNorm = b / 255;

            const max = Math.max(rNorm, gNorm, bNorm);
            const min = Math.min(rNorm, gNorm, bNorm);
            const l = (max + min) / 2;
            const d = max - min;
            const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

            let h = 0;
            if (d !== 0) {
                if (max === rNorm) h = ((gNorm - bNorm) / d) % 6;
                else if (max === gNorm) h = (bNorm - rNorm) / d + 2;
                else h = (rNorm - gNorm) / d + 4;
                h = Math.round(h * 60);
                if (h < 0) h += 360;
            }

            // Determine category based on HSL values
            if (l < 0.12) return "Black";
            if (l > 0.92 && s < 0.1) return "White";
            if (s < 0.08) return "Grey";

            // Very dark colors
            if (l < 0.2) {
                if (h >= 200 && h < 260) return "Navy";
                if (h >= 340 || h < 20) return "Maroon";
                return "Black";
            }

            // Determine by hue (color wheel)
            if (h >= 0 && h < 12) return l < 0.4 ? "Maroon" : "Red";
            if (h >= 12 && h < 45)
                return s < 0.4 ? (l > 0.6 ? "Beige" : "Brown") : "Orange";
            if (h >= 45 && h < 65) return "Yellow";
            if (h >= 65 && h < 165) return "Green";
            if (h >= 165 && h < 200) return l < 0.35 ? "Green" : "Blue";
            if (h >= 200 && h < 260) return l < 0.25 ? "Navy" : "Blue";
            if (h >= 260 && h < 290) return "Purple";
            if (h >= 290 && h < 340) return "Pink";
            if (h >= 340) return l < 0.4 ? "Maroon" : "Red";
        }
    } catch {
        // Continue to fallback
    }

    // 4. FALLBACK - Unknown colors go to Multi
    return "Multi";
};

/**
 * Get the hex code for a main color category
 */
export const getMainColorHex = (categoryName: string): string => {
    const category = MAIN_COLOR_CATEGORIES.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.hex || "#E5E5E5";
};

/**
 * Group an array of color objects by their main category
 * This is the main helper function for building filter UIs
 */
export const groupColorsByCategory = (
    colors: { name: string; count: number }[]
): {
    category: string;
    hex: string;
    rawColors: string[];
    totalCount: number;
}[] => {
    const groups: Record<string, { rawColors: string[]; totalCount: number }> =
        {};

    for (const color of colors) {
        const category = getMainColorCategory(color.name);
        if (!groups[category]) {
            groups[category] = { rawColors: [], totalCount: 0 };
        }
        groups[category].rawColors.push(color.name);
        groups[category].totalCount += color.count;
    }

    // Return sorted by total count descending
    return MAIN_COLOR_CATEGORIES.filter((cat) => groups[cat.name])
        .map((cat) => ({
            category: cat.name,
            hex: cat.hex,
            rawColors: groups[cat.name]?.rawColors || [],
            totalCount: groups[cat.name]?.totalCount || 0,
        }))
        .sort((a, b) => b.totalCount - a.totalCount);
};
