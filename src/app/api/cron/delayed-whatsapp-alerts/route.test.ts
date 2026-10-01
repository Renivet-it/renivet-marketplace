import { expect, test } from "bun:test";

test("delayed WhatsApp cron route is protected and delegates to the database run service", async () => {
    const source = await Bun.file(
        "src/app/api/cron/delayed-whatsapp-alerts/route.ts"
    ).text();

    expect(source).toContain("requireCronSecret");
    expect(source).toContain("runDelayedWhatsAppAlertsFromDatabase");
    expect(source).toContain("export async function GET");
});
