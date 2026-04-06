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

function normalizePostHogApiHost(rawHost?: string | null) {
    if (!rawHost) return null;

    const withProtocol = /^https?:\/\//i.test(rawHost)
        ? rawHost
        : `https://${rawHost}`;

    try {
        const parsed = new URL(withProtocol);
        // `*.i.posthog.com` is the ingestion host. HogQL/API requests must use app host.
        parsed.hostname = parsed.hostname.replace(/\.i\.posthog\.com$/i, ".posthog.com");
        return parsed.origin.replace(/\/$/, "");
    } catch {
        return rawHost.replace(/\/$/, "");
    }
}

function getPostHogConfig() {
    const host = normalizePostHogApiHost(
        process.env.POSTHOG_API_HOST ?? env.NEXT_PUBLIC_POSTHOG_HOST
    );
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
            const errorText = await response.text().catch(() => "");
            console.error(
                "PostHog HogQL query failed",
                response.status,
                errorText.slice(0, 500)
            );
            return [];
        }

        const payload = (await response.json()) as {
            results?: unknown[];
            columns?: string[];
        };

        const rawResults = Array.isArray(payload.results) ? payload.results : [];
        if (rawResults.length === 0) return [];

        const firstRow = rawResults[0];

        if (firstRow && typeof firstRow === "object" && !Array.isArray(firstRow)) {
            return rawResults as T[];
        }

        const columns = Array.isArray(payload.columns) ? payload.columns : [];
        if (columns.length === 0) {
            console.error("PostHog HogQL query returned array rows without columns");
            return [];
        }

        return rawResults
            .filter((row): row is unknown[] => Array.isArray(row))
            .map((row) => {
                const mapped: Record<string, unknown> = {};
                for (let i = 0; i < columns.length; i += 1) {
                    mapped[columns[i] ?? `col_${i}`] = row[i];
                }
                return mapped as T;
            });
    } catch (error) {
        console.error("PostHog HogQL request failed", error);
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
            uniq(distinct_id) AS visitors,
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
            substring(toString(timestamp), 1, 10) AS date_key,
            countDistinctIf(toString(properties.$session_id), toString(properties.$session_id) != '') AS sessions,
            uniq(distinct_id) AS visitors,
            countDistinctIf(toString(properties.$session_id), event = 'add_to_cart' AND toString(properties.$session_id) != '') AS sessions_with_cart,
            countDistinctIf(toString(properties.$session_id), event = 'checkout_started' AND toString(properties.$session_id) != '') AS sessions_reached_checkout
        FROM events
        WHERE timestamp >= toDateTime('${startSql}')
          AND timestamp <= toDateTime('${endSql}')
        GROUP BY date_key
        ORDER BY date_key
    `);

    const bounceRows = await runHogQL<{
        date_key: string;
        bounce_sessions: number;
    }>(`
        WITH pageview_sessions AS (
            SELECT
                substring(toString(timestamp), 1, 10) AS date_key,
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
    const safeLimit = Math.max(limit, 1);

    const detailedRows = await runHogQL<{
        date_key: string;
        landing_path: string;
        landing_type: string;
        sessions: number;
        visitors: number;
        sessions_with_cart: number;
        sessions_reached_checkout: number;
    }>(`
        WITH session_first_touch AS (
            SELECT
                coalesce(
                    nullIf(toString(properties.$session_id), ''),
                    concat('anon:', toString(distinct_id), ':', substring(toString(timestamp), 1, 10))
                ) AS session_key,
                argMin(
                    coalesce(
                        nullIf(toString(properties.$pathname), ''),
                        nullIf(
                            extract(
                                toString(properties.$current_url),
                                'https?://[^/]+([^?#]*)'
                            ),
                            ''
                        ),
                        nullIf(toString(properties.$current_url), ''),
                        'unknown'
                    ),
                    timestamp
                ) AS landing_path,
                argMin(distinct_id, timestamp) AS visitor_id,
                substring(toString(min(timestamp)), 1, 10) AS date_key
            FROM events
            WHERE event = '$pageview'
              AND timestamp >= toDateTime('${startSql}')
              AND timestamp <= toDateTime('${endSql}')
            GROUP BY session_key
        ),
        session_engagement AS (
            SELECT
                coalesce(
                    nullIf(toString(properties.$session_id), ''),
                    concat('anon:', toString(distinct_id), ':', substring(toString(timestamp), 1, 10))
                ) AS session_key,
                max(event = 'add_to_cart') AS has_cart,
                max(event = 'checkout_started') AS has_checkout
            FROM events
            WHERE timestamp >= toDateTime('${startSql}')
              AND timestamp <= toDateTime('${endSql}')
              AND event IN ('add_to_cart', 'checkout_started')
            GROUP BY session_key
        )
        SELECT
            s.date_key,
            s.landing_path,
            multiIf(
                startsWith(s.landing_path, '/products'),
                'product',
                startsWith(s.landing_path, '/collections'),
                'collection',
                startsWith(s.landing_path, '/'),
                'page',
                'unknown'
            ) AS landing_type,
            count() AS sessions,
            uniq(s.visitor_id) AS visitors,
            countIf(e.has_cart = 1) AS sessions_with_cart,
            countIf(e.has_checkout = 1) AS sessions_reached_checkout
        FROM session_first_touch s
        LEFT JOIN session_engagement e ON e.session_key = s.session_key
        GROUP BY s.date_key, s.landing_path, landing_type
        ORDER BY sessions DESC
        LIMIT ${safeLimit}
    `);

    if (detailedRows.length > 0) {
        return detailedRows.map((row) => ({
            dateKey: row.date_key,
            landingPath: String(row.landing_path ?? "unknown"),
            landingType: String(row.landing_type ?? "unknown"),
            sessions: toNumber(row.sessions),
            visitors: toNumber(row.visitors),
            sessionsWithCart: toNumber(row.sessions_with_cart),
            sessionsReachedCheckout: toNumber(row.sessions_reached_checkout),
        }));
    }

    const fallbackRows = await runHogQL<{
        date_key: string;
        landing_path: string;
        landing_type: string;
        sessions: number;
        visitors: number;
    }>(`
        SELECT
            substring(toString(timestamp), 1, 10) AS date_key,
            coalesce(nullIf(toString(properties.$pathname), ''), 'unknown') AS landing_path,
            multiIf(
                startsWith(coalesce(nullIf(toString(properties.$pathname), ''), 'unknown'), '/products'),
                'product',
                startsWith(coalesce(nullIf(toString(properties.$pathname), ''), 'unknown'), '/collections'),
                'collection',
                startsWith(coalesce(nullIf(toString(properties.$pathname), ''), 'unknown'), '/'),
                'page',
                'unknown'
            ) AS landing_type,
            uniq(
                coalesce(
                    nullIf(toString(properties.$session_id), ''),
                    concat('anon:', toString(distinct_id), ':', substring(toString(timestamp), 1, 10))
                )
            ) AS sessions,
            uniq(distinct_id) AS visitors
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= toDateTime('${startSql}')
          AND timestamp <= toDateTime('${endSql}')
        GROUP BY date_key, landing_path, landing_type
        ORDER BY sessions DESC
        LIMIT ${safeLimit}
    `);

    if (fallbackRows.length > 0) {
        console.warn(
            "PostHog landing detailed query returned no rows. Using fallback landing query."
        );
    }

    return fallbackRows.map((row) => ({
        dateKey: row.date_key,
        landingPath: String(row.landing_path ?? "unknown"),
        landingType: String(row.landing_type ?? "unknown"),
        sessions: toNumber(row.sessions),
        visitors: toNumber(row.visitors),
        sessionsWithCart: 0,
        sessionsReachedCheckout: 0,
    }));
}



