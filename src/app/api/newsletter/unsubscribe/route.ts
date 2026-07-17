import {
    unsubscribeByEmail,
    verifyUnsubscribeToken,
} from "@/lib/marketing/email";
import { NextRequest, NextResponse } from "next/server";

function renderHtml(message: string) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Renivet Newsletter</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f7f4ef; color:#1f2937; margin:0; padding:40px 20px; }
      .card { max-width:560px; margin:0 auto; background:#fff; border-radius:16px; padding:32px; box-shadow:0 10px 30px rgba(0,0,0,.08); }
      h1 { margin:0 0 12px; font-size:28px; }
      p { line-height:1.6; margin:0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Renivet</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
        return new NextResponse(renderHtml("This unsubscribe link is missing a token."), {
            status: 400,
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    try {
        const { email } = await verifyUnsubscribeToken(token);
        const result = await unsubscribeByEmail(email);

        return new NextResponse(
            renderHtml(
                result
                    ? `You have been unsubscribed from Renivet marketing emails for ${email}.`
                    : `We could not find an active Renivet subscriber for ${email}.`
            ),
            {
                status: 200,
                headers: { "content-type": "text/html; charset=utf-8" },
            }
        );
    } catch {
        return new NextResponse(
            renderHtml("This unsubscribe link is invalid or has expired."),
            {
                status: 400,
                headers: { "content-type": "text/html; charset=utf-8" },
            }
        );
    }
}
