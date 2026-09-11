export type JourneyExpectation = "public_page" | "login_wall";

export type GuestJourney = {
    id: string;
    name: string;
    path: string;
    expected: JourneyExpectation;
    readOnly: true;
    actions: readonly string[];
};

export const guestJourneys: readonly GuestJourney[] = [
    ["home", "Homepage", "/", "public_page"],
    ["shop", "Shop catalog", "/shop", "public_page"],
    ["search", "Search results", "/shop?search=shirt", "public_page"],
    ["product", "Product detail entry", "/shop", "public_page"],
    ["brand-shop", "Brand shop entry", "/brands", "public_page"],
    ["new-arrivals", "New arrivals", "/new-arrivals", "public_page"],
    ["blogs", "Blog index", "/blogs", "public_page"],
    ["protected-profile", "Protected profile login wall", "/profile", "login_wall"],
    ["guest-cart", "Guest cart login wall", "/mycart", "login_wall"],
    ["guest-checkout", "Guest checkout login wall", "/checkout", "login_wall"],
].map(([id, name, path, expected]) => ({
    id,
    name,
    path,
    expected: expected as JourneyExpectation,
    readOnly: true,
    actions: expected === "login_wall" ? ["navigate", "assert_login_wall"] : ["navigate", "assert_page"],
}));

function originOf(value: string) {
    try {
        return new URL(value).origin;
    } catch {
        throw new Error(`Invalid E2E target URL: ${value}`);
    }
}

export function validateTargetOrigin(target: string, allowedOrigins: readonly string[]) {
    const origin = originOf(target);
    const parsed = new URL(origin);
    const isLoopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!isLoopback && !allowedOrigins.includes(origin)) {
        throw new Error(`Target origin is blocked: ${origin}`);
    }
    if (origin === "https://renivet.com" || origin === "https://www.renivet.com") {
        throw new Error(`Target origin is blocked: ${origin}`);
    }
    return origin;
}

export function buildJourneyUrl(baseUrl: string, path: string) {
    const origin = validateTargetOrigin(baseUrl, (process.env.E2E_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean));
    return new URL(path, `${origin}/`).toString();
}

export function classifyPage({ finalUrl, bodyText, expected }: { finalUrl: string; bodyText: string; expected: JourneyExpectation }) {
    const loginWall = /sign in|sign up|login|authentication required/i.test(`${finalUrl}\n${bodyText}`);
    if (expected === "login_wall" && !loginWall) return "unexpected_access" as const;
    if (expected === "public_page" && loginWall) return "unexpected_login_wall" as const;
    return expected;
}

export function agentBrowserInvocation(args: readonly string[]) {
    return ["bunx", "agent-browser", ...args];
}

async function runCommand(args: readonly string[]) {
    const child = Bun.spawn(agentBrowserInvocation(args), { stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
    ]);
    if (exitCode !== 0) throw new Error(stderr || stdout || `agent-browser failed: ${args.join(" ")}`);
    return stdout.trim();
}

export async function runGuestJourneys({ baseUrl = process.env.E2E_BASE_URL } = {}) {
    if (!baseUrl) throw new Error("E2E_BASE_URL is required");
    validateTargetOrigin(baseUrl, (process.env.E2E_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean));
    const results: Array<Record<string, unknown>> = [];
    await runCommand(["open", "about:blank"]);
    try {
        for (const journey of guestJourneys) {
            const startedAt = new Date().toISOString();
            const url = buildJourneyUrl(baseUrl, journey.path);
            await runCommand(["open", url]);
            await runCommand(["wait", "--load", "networkidle"]);
            const finalUrl = await runCommand(["get", "url"]);
            const bodyText = await runCommand(["eval", "document.body.innerText"]);
            const observed = classifyPage({ finalUrl, bodyText, expected: journey.expected });
            results.push({ id: journey.id, expected: journey.expected, observed, startedAt, targetOrigin: new URL(baseUrl).origin });
            if (observed !== journey.expected) throw new Error(`${journey.id} expected ${journey.expected}, observed ${observed}`);
        }
    } finally {
        await runCommand(["close"]);
    }
    return results;
}

if (import.meta.main) {
    const results = await runGuestJourneys();
    console.log(JSON.stringify(results, null, 2));
}
