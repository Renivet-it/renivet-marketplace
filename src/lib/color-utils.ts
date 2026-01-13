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
