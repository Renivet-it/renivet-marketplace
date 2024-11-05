export const DEFAULT_MESSAGES = {
    ERRORS: {
        GENERIC: "An error occurred, please try again later",
        USER_FETCHING: "Please wait while we fetch your user data...",
        EMAIL_NOT_FOUND: "Email address not found",
        PHONE_NOT_FOUND: "Phone number not found",
    },
} as const;

export const DEFAULT_AVATAR_URL = "/avatars/default_avatar.png" as const;
export const DEFAULT_BLOG_THUMBNAIL_URL =
    "/thumbnails/blogs/default_blog_thumbnail.png" as const;
