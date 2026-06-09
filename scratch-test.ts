async function main() {
    // Read from process.env (Bun automatically loads .env.local)
    const token = process.env.META_ACCESS_TOKEN;
    if (!token || token.includes("your_token_here") || token.trim() === "") {
        console.error("\n❌ ERROR: Please paste your generated Meta Access Token inside .env.local first!");
        console.error("Look for META_ACCESS_TOKEN=... in your .env.local file.\n");
        process.exit(1);
    }

    console.log("\nConnecting to Meta Graph API...");
    const url = `https://graph.facebook.com/v20.0/me/accounts?fields=instagram_business_account,name&access_token=${token}`;

    try {
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.error) {
            console.error("\n❌ Meta API Error:", data.error.message);
            console.error("Reason:", data.error.error_user_title || "Unknown");
            process.exit(1);
        }

        const pages = data.data ?? [];
        if (pages.length === 0) {
            console.log("\nℹ️ No Facebook Pages found. Make sure your system user has access to at least one page in your Business settings.");
            process.exit(0);
        }

        let found = false;
        for (const page of pages) {
            console.log(`\nPage found: "${page.name}"`);
            if (page.instagram_business_account) {
                console.log(`🎉 SUCCESS! FOUND INSTAGRAM BUSINESS ACCOUNT:`);
                console.log(`-----------------------------------------------`);
                console.log(`ID: ${page.instagram_business_account.id}`);
                console.log(`-----------------------------------------------`);
                console.log(`👉 Copy the ID above and paste it into your .env.local under:`);
                console.log(`INSTAGRAM_BUSINESS_ACCOUNT_ID=${page.instagram_business_account.id}\n`);
                found = true;
            } else {
                console.log(`  (No linked Instagram Business Account found for this Page)`);
            }
        }

        if (!found) {
            console.log("\n⚠️ No linked Instagram Business Account was detected. Ensure your Instagram account is linked to your Facebook Page in Page Settings.");
        }
    } catch (err: any) {
        console.error("\n❌ Network Error:", err.message);
    }
    process.exit(0);
}

main().catch(console.error);
