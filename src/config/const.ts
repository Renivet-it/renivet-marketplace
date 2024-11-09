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

export const DEFAULT_AVATAR_URL = "/avatars/default_avatar.png" as const;
export const DEFAULT_BLOG_THUMBNAIL_URL =
    "/thumbnails/blogs/default_blog_thumbnail.png" as const;
