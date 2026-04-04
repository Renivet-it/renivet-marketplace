import { env } from "@/../env";

export interface PostHogBehaviorOverview {
    sessions: number;
    visitors: number;
    sessionsWithCart: number;
    sessionsReachedCheckout: number;
    bounceSessions: number;
}

export interface PostHogDailyBehaviorRow {
    dateKey: string;
    sessions: number;
    visitors: number;
    sessionsWithCart: number;
    sessionsReachedCheckout: number;
    bounceSessions: number;
}

export interface PostHogLandingPageRow {
    dateKey: string;
    landingPath: string;
    landingType: string;
    sessions: number;
    visitors: number;
    sessionsWithCart: number;
    sessionsReachedCheckout: number;
}

function toNumber(value: unknown) {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
}

function formatDateTime(date: Date) {
    return date.toISOString().replace("T", " ").slice(0, 19);
}

function getPostHogConfig() {
    const host = env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "");
    const projectId = process.env.POSTHOG_PROJECT_ID;
    const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

    if (!host || !projectId || !personalApiKey) {
        return null;
    }

    return {
        host,
        projectId,
        personalApiKey,
    };
}

async function runHogQL<T extends Record<string, unknown>>(query: string): Promise<T[]> {
    const config = getPostHogConfig();
    if (!config) return [];

    try {
        const response = await fetch(
            `${config.host}/api/projects/${config.projectId}/query/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${config.personalApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: {
                        kind: "HogQLQuery",
                        query,
                    },
                }),
            }
        );

        if (!response.ok) {
            return [];
        }

        const payload = (await response.json()) as {
            results?: T[];
        };

        return payload.results ?? [];
    } catch {
        return [];
    }
}

export function isPostHogBehaviorConfigured() {
    return Boolean(getPostHogConfig());
}

export async function getPostHogBehaviorOverview(start: Date, end: Date): Promise<PostHogBehaviorOverview> {
    const startSql = formatDateTime(start);
    const endSql = formatDateTime(end);

    const overviewRows = await runHogQL<{
        sessions: number;
        visitors: number;
        sessions_with_cart: number;
        sessions_reached_checkout: number;
    }>(`
        SELECT
            countDistinctIf(toString(properties.$session_id), toString(properties.$session_id) != '') AS sessions,
            countDistinct(distinct_id) AS visitors,
            countDistinctIf(toString(properties.$session_id), event = 'add_to_cart' AND toString(properties.$session_id) != '') AS sessions_with_cart,
            countDistinctIf(toString(properties.$session_id), event = 'checkout_started' AND toString(properties.$session_id) != '') AS sessions_reached_checkout
        FROM events
        WHERE timestamp >= toDateTime('${startSql}')
          AND timestamp <= toDateTime('${endSql}')
    `);

    const bounceRows = await runHogQL<{ bounce_sessions: number }>(`
        WITH pageview_sessions AS (
            SELECT
                toString(properties.$session_id) AS session_id,
                count() AS pageviews
            FROM events
            WHERE event = '$pageview'
              AND timestamp >= toDateTime('${startSql}')
              AND timestamp <= toDateTime('${endSql}')
              AND toString(properties.$session_id) != ''
            GROUP BY session_id
        )
        SELECT countIf(pageviews = 1) AS bounce_sessions
        FROM pageview_sessions
    `);

    const row = overviewRows[0];
    const bounce = bounceRows[0];

    return {
        sessions: toNumber(row?.sessions),
        visitors: toNumber(row?.visitors),
        sessionsWithCart: toNumber(row?.sessions_with_cart),
        sessionsReachedCheckout: toNumber(row?.sessions_reached_checkout),
        bounceSessions: toNumber(bounce?.bounce_sessions),
    };
}

export async function getPostHogDailyBehavior(start: Date, end: Date): Promise<PostHogDailyBehaviorRow[]> {
    const startSql = formatDateTime(start);
    const endSql = formatDateTime(end);

    const rows = await runHogQL<{
        date_key: string;
        sessions: number;
        visitors: number;
        sessions_with_cart: number;
        sessions_reached_checkout: number;
    }>(`
        SELECT
            toString(toDate(timestamp)) AS date_key,
            countDistinctIf(toString(properties.$session_id), toString(properties.$session_id) != '') AS sessions,
            countDistinct(distinct_id) AS visitors,
            countDistinctIf(toString(properties.$session_id), event = 'add_to_cart' AND toString(properties.$session_id) != '') AS sessions_with_cart,
            countDistinctIf(toString(properties.$session_id), event = 'checkout_started' AND toString(properties.$session_id) != '') AS sessions_reached_checkout
        FROM events
        WHERE timestamp >= toDateTime('${startSql}')
          AND timestamp <= toDateTime('${endSql}')
        GROUP BY toDate(timestamp)
        ORDER BY toDate(timestamp)
    `);

    const bounceRows = await runHogQL<{
        date_key: string;
        bounce_sessions: number;
    }>(`
        WITH pageview_sessions AS (
            SELECT
                toString(toDate(timestamp)) AS date_key,
                toString(properties.$session_id) AS session_id,
                count() AS pageviews
            FROM events
            WHERE event = '$pageview'
              AND timestamp >= toDateTime('${startSql}')
              AND timestamp <= toDateTime('${endSql}')
              AND toString(properties.$session_id) != ''
            GROUP BY date_key, session_id
        )
        SELECT
            date_key,
            countIf(pageviews = 1) AS bounce_sessions
        FROM pageview_sessions
        GROUP BY date_key
    `);

    const bounceByDate = new Map(
        bounceRows.map((row) => [row.date_key, toNumber(row.bounce_sessions)])
    );

    return rows.map((row) => ({
        dateKey: row.date_key,
        sessions: toNumber(row.sessions),
        visitors: toNumber(row.visitors),
        sessionsWithCart: toNumber(row.sessions_with_cart),
        sessionsReachedCheckout: toNumber(row.sessions_reached_checkout),
        bounceSessions: bounceByDate.get(row.date_key) ?? 0,
    }));
}

export async function getPostHogLandingPageDaily(
    start: Date,
    end: Date,
    limit = 2000
): Promise<PostHogLandingPageRow[]> {
    const startSql = formatDateTime(start);
    const endSql = formatDateTime(end);

    const rows = await runHogQL<{
        date_key: string;
        landing_path: string;
        landing_type: string;
        sessions: number;
        visitors: number;
        sessions_with_cart: number;
        sessions_reached_checkout: number;
    }>(`
        SELECT
            toString(toDate(timestamp)) AS date_key,
            coalesce(toString(properties.$pathname), 'unknown') AS landing_path,
            multiIf(startsWith(coalesce(toString(properties.$pathname), ''), '/products'), 'product', startsWith(coalesce(toString(properties.$pathname), ''), '/collections'), 'collection', startsWith(coalesce(toString(properties.$pathname), ''), '/'), 'page', 'unknown') AS landing_type,
            countDistinctIf(toString(properties.$session_id), toString(properties.$session_id) != '') AS sessions,
            countDistinct(distinct_id) AS visitors,
            countDistinctIf(toString(properties.$session_id), event = 'add_to_cart' AND toString(properties.$session_id) != '') AS sessions_with_cart,
            countDistinctIf(toString(properties.$session_id), event = 'checkout_started' AND toString(properties.$session_id) != '') AS sessions_reached_checkout
        FROM events
        WHERE timestamp >= toDateTime('${startSql}')
          AND timestamp <= toDateTime('${endSql}')
          AND event IN ('$pageview', 'add_to_cart', 'checkout_started')
        GROUP BY toDate(timestamp), landing_path, landing_type
        ORDER BY sessions DESC
        LIMIT ${Math.max(limit, 1)}
    `);

    return rows.map((row) => ({
        dateKey: row.date_key,
        landingPath: row.landing_path,
        landingType: row.landing_type,
        sessions: toNumber(row.sessions),
        visitors: toNumber(row.visitors),
        sessionsWithCart: toNumber(row.sessions_with_cart),
        sessionsReachedCheckout: toNumber(row.sessions_reached_checkout),
    }));
}
