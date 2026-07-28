import "dotenv/config";
import { env } from "@/../env";
import { resend } from "@/lib/resend";
import AccountCreated from "@/lib/resend/emails/account-created";

const recipient = "ayanganguly333@gmail.com";

async function main() {
    const result = await resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to: recipient,
        subject: "[Example] Welcome Aboard the Renivet Express!",
        react: AccountCreated({
            user: { firstName: "Ayan", lastName: "Ganguly" },
            addCode: false,
        }),
    });

    if (result.error) throw new Error(JSON.stringify(result.error));
    console.log(
        `Welcome email sent to ${recipient}. Message ID: ${result.data?.id}`
    );
}

main().catch((error) => {
    console.error("Failed to send welcome email example:", error);
    process.exit(1);
});
