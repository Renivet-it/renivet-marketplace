export const DEFAULT_MESSAGES = {
    ERRORS: {
        GENERIC: "An error occurred, please try again later",
        USER_FETCHING: "Please wait while we fetch your user data...",
        EMAIL_NOT_FOUND: "Email address not found",
        PHONE_NOT_FOUND: "Phone number not found",
        SIGNUP_DISABLED:
            "Account creation is currently disabled, please try again later",
        SIGNIN_DISABLED: "Account sign in is currently disabled",
        FORGOT_PASSWORD_DISABLED:
            "Password recovery is currently disabled, please try again later",
    },
} as const;

export const DEFAULT_AVATAR_URL =
    "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNyaieDfB5TEHko4KfX8CDn1z7Q2migSIjw0ds" as const;
export const DEFAULT_BLOG_THUMBNAIL_URL =
    "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNprAppIYoKFqlYMSWzhgNZG6Cm5OtIUjre39T" as const;

export const FREE_DELIVERY_THRESHOLD = 499 as const;

export const PRESET_COLORS = [
    { name: "Red", hex: "#ff0000" },
    { name: "Blue", hex: "#0000ff" },
    { name: "Green", hex: "#00ff00" },
    { name: "Yellow", hex: "#ffff00" },
    { name: "Orange", hex: "#ffa500" },
    { name: "Pink", hex: "#ffc0cb" },
    { name: "White", hex: "#ffffff" },
    { name: "Black", hex: "#000000" },
    { name: "Gray", hex: "#808080" },
    { name: "Brown", hex: "#a52a2a" },
    { name: "Purple", hex: "#800080" },
    { name: "Cyan", hex: "#00ffff" },
    { name: "Magenta", hex: "#ff00ff" },
    { name: "Teal", hex: "#008080" },
    { name: "Maroon", hex: "#800000" },
    { name: "Navy", hex: "#000080" },
    { name: "Olive", hex: "#808000" },
    { name: "Silver", hex: "#c0c0c0" },
    { name: "Sky Blue", hex: "#87ceeb" },
    { name: "Indigo", hex: "#4b0082" },
];
