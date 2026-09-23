const testEnvironment: Record<string, string> = {
    CLERK_SECRET_KEY: "test-clerk-secret",
    SVIX_SECRET: "test-svix-secret",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    UPLOADTHING_TOKEN: "test-uploadthing-token",
    JWT_SECRET_KEY: "test-jwt-secret",
    GOOGLE_ANALYTICS_ID: "test-google-analytics",
    FACEBOOK_CAPI_ACCESS_TOKEN: "test-facebook-token",
    RESEND_API_KEY: "test-resend-key",
    RAZOR_PAY_KEY_ID: "test-razorpay-key",
    RAZOR_PAY_SECRET_KEY: "test-razorpay-secret",
    RAZOR_PAY_WEBHOOK_SECRET: "test-razorpay-webhook",
    RESEND_EMAIL_FROM: "test@example.com",
    RENIVET_EMAIL_1: "test-renivet-1@example.com",
    RENIVET_EMAIL_2: "test-renivet-2@example.com",
    SHIPROCKET_LOGIN_EMAIL: "test-shiprocket@example.com",
    SHIPROCKET_LOGIN_PASSWORD: "test-shiprocket-password",
    SHIPROCKET_WEBHOOK_API_KEY: "test-shiprocket-webhook",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_renivet",
    NEXT_PUBLIC_RAZOR_PAY_KEY_ID: "rzp_test_renivet",
    NEXT_PUBLIC_FACEBOOK_APP_ID: "test-facebook-app",
    NEXT_PUBLIC_POSTHOG_KEY: "test-posthog-key",
    NEXT_PUBLIC_POSTHOG_HOST: "https://app.posthog.com",
    APP_ENV: "development",
    NODE_ENV: "test",
};

for (const [key, value] of Object.entries(testEnvironment)) {
    if (!process.env[key]) process.env[key] = value;
}
