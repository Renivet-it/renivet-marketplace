import { generateChatResponse, type ChatMessage } from "@/lib/chat/chat";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history } = body as {
            message: string;
            history: ChatMessage[];
        };

        if (
            !message ||
            typeof message !== "string" ||
            message.trim().length === 0
        ) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        if (message.length > 500) {
            return NextResponse.json(
                { error: "Message is too long (max 500 characters)" },
                { status: 400 }
            );
        }

        // Sanitize and limit history
        const sanitizedHistory: ChatMessage[] = (history || [])
            .slice(-10)
            .filter(
                (msg: any) =>
                    msg &&
                    typeof msg.role === "string" &&
                    typeof msg.content === "string" &&
                    ["user", "assistant"].includes(msg.role)
            )
            .map((msg: any) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content.slice(0, 1000),
            }));

        const result = await generateChatResponse(
            message.trim(),
            sanitizedHistory
        );

        return NextResponse.json({
            content: result.content,
            products: result.products,
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            {
                content:
                    "I'm having trouble right now. Please try again in a moment!",
                products: [],
            },
            { status: 500 }
        );
    }
}
