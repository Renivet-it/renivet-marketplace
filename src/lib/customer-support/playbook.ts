export const SUPPORT_WORKING_HOURS = {
    startHour: 10,
    endHour: 20,
    firstHumanResponseHour: 10,
    firstHumanResponseMinute: 30,
    workingDays: [1, 2, 3, 4, 5, 6],
};

export const SUPPORT_TICKET_STATUSES = [
    "new",
    "acknowledged",
    "in_progress",
    "waiting_customer",
    "waiting_brand",
    "waiting_internal",
    "resolved",
    "refunded",
    "replaced",
    "declined",
    "closed",
    "auto_closed",
    "reopened",
    "escalated",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const LEGACY_SUPPORT_STATUS_MAP: Record<string, SupportTicketStatus> = {
    open: "new",
    in_review: "in_progress",
    waiting_for_customer: "waiting_customer",
    waiting_for_brand: "waiting_brand",
    approved: "in_progress",
    rejected: "declined",
    resolved: "resolved",
    closed: "closed",
    escalated: "escalated",
};

export const SUPPORT_RESOLUTION_CODES = [
    "RES_REFUND_FULL",
    "RES_REFUND_PARTIAL",
    "RES_REPLACEMENT",
    "RES_INFO_PROVIDED",
    "RES_REDIRECTED_TO_BRAND",
    "RES_DECLINED_OUT_OF_WINDOW",
    "RES_DECLINED_INELIGIBLE",
    "RES_DECLINED_OTHER",
    "RES_GOODWILL",
    "RES_AUTOCLOSED_NO_RESPONSE",
    "RES_DUPLICATE_TICKET",
    "RES_ESCALATED_TO_LEGAL",
] as const;

export type SupportResolutionCode = (typeof SUPPORT_RESOLUTION_CODES)[number];

export const SUPPORT_CHANNELS = [
    "web_form",
    "email",
    "instagram_dm",
    "whatsapp_business",
    "order_page",
    "admin_manual",
] as const;

export type SupportChannel = (typeof SUPPORT_CHANNELS)[number];

export type SupportPriority = "low" | "normal" | "medium" | "high" | "critical";

export type SupportCategoryConfig = {
    category: string;
    priority: SupportPriority;
    firstResponseMinutes: number;
    resolutionMinutes: number | null;
    defaultOwnerRole: "support" | "order_ops" | "aj" | "kp" | "ps" | "it";
    requiresAj?: boolean;
    requiresKp?: boolean;
    requiresPs?: boolean;
    autoEscalate?: boolean;
};

const HOUR = 60;
const DAY = 24 * HOUR;

export const SUPPORT_CATEGORY_MATRIX: Record<string, SupportCategoryConfig> = {
    ORDER_NOT_RECEIVED: {
        category: "ORDER_NOT_RECEIVED",
        priority: "high",
        firstResponseMinutes: HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "order_ops",
    },
    ORDER_DELAYED: {
        category: "ORDER_DELAYED",
        priority: "medium",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "order_ops",
    },
    ORDER_CANCEL_REQUEST: {
        category: "ORDER_CANCEL_REQUEST",
        priority: "high",
        firstResponseMinutes: HOUR,
        resolutionMinutes: 4 * HOUR,
        defaultOwnerRole: "support",
    },
    ORDER_MODIFY_REQUEST: {
        category: "ORDER_MODIFY_REQUEST",
        priority: "high",
        firstResponseMinutes: HOUR,
        resolutionMinutes: 4 * HOUR,
        defaultOwnerRole: "support",
    },
    PRODUCT_DAMAGED: {
        category: "PRODUCT_DAMAGED",
        priority: "high",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: 2 * DAY,
        defaultOwnerRole: "support",
    },
    PRODUCT_DEFECTIVE: {
        category: "PRODUCT_DEFECTIVE",
        priority: "high",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: 2 * DAY,
        defaultOwnerRole: "support",
    },
    PRODUCT_NOT_AS_DESCRIBED: {
        category: "PRODUCT_NOT_AS_DESCRIBED",
        priority: "medium",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: 2 * DAY,
        defaultOwnerRole: "support",
    },
    PRODUCT_WRONG_ITEM: {
        category: "PRODUCT_WRONG_ITEM",
        priority: "high",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
    RETURN_REQUEST: {
        category: "RETURN_REQUEST",
        priority: "medium",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
    REFUND_STATUS: {
        category: "REFUND_STATUS",
        priority: "medium",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
    REFUND_NOT_RECEIVED: {
        category: "REFUND_NOT_RECEIVED",
        priority: "high",
        firstResponseMinutes: HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
    SIZE_FIT_HELP: {
        category: "SIZE_FIT_HELP",
        priority: "low",
        firstResponseMinutes: 4 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
    SUSTAINABILITY_QUERY: {
        category: "SUSTAINABILITY_QUERY",
        priority: "low",
        firstResponseMinutes: 4 * HOUR,
        resolutionMinutes: 2 * DAY,
        defaultOwnerRole: "kp",
        requiresKp: true,
    },
    PRE_PURCHASE_QUERY: {
        category: "PRE_PURCHASE_QUERY",
        priority: "low",
        firstResponseMinutes: 4 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
    ACCOUNT_LOGIN_ISSUE: {
        category: "ACCOUNT_LOGIN_ISSUE",
        priority: "medium",
        firstResponseMinutes: 2 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "it",
    },
    PAYMENT_FAILED: {
        category: "PAYMENT_FAILED",
        priority: "high",
        firstResponseMinutes: HOUR,
        resolutionMinutes: 4 * HOUR,
        defaultOwnerRole: "aj",
        requiresAj: true,
    },
    DATA_DELETION_REQUEST: {
        category: "DATA_DELETION_REQUEST",
        priority: "high",
        firstResponseMinutes: 4 * HOUR,
        resolutionMinutes: 7 * DAY,
        defaultOwnerRole: "aj",
        requiresAj: true,
    },
    LEGAL_THREAT: {
        category: "LEGAL_THREAT",
        priority: "critical",
        firstResponseMinutes: 30,
        resolutionMinutes: null,
        defaultOwnerRole: "aj",
        requiresAj: true,
        requiresKp: true,
        autoEscalate: true,
    },
    SOCIAL_COMPLAINT: {
        category: "SOCIAL_COMPLAINT",
        priority: "critical",
        firstResponseMinutes: 30,
        resolutionMinutes: DAY,
        defaultOwnerRole: "aj",
        requiresAj: true,
        requiresPs: true,
        autoEscalate: true,
    },
    BULK_B2B_INQUIRY: {
        category: "BULK_B2B_INQUIRY",
        priority: "low",
        firstResponseMinutes: DAY,
        resolutionMinutes: DAY,
        defaultOwnerRole: "kp",
        requiresKp: true,
    },
    FEEDBACK_PRAISE: {
        category: "FEEDBACK_PRAISE",
        priority: "low",
        firstResponseMinutes: DAY,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
    FEEDBACK_COMPLAINT_GENERAL: {
        category: "FEEDBACK_COMPLAINT_GENERAL",
        priority: "medium",
        firstResponseMinutes: 4 * HOUR,
        resolutionMinutes: 2 * DAY,
        defaultOwnerRole: "support",
    },
    OTHER: {
        category: "OTHER",
        priority: "medium",
        firstResponseMinutes: 4 * HOUR,
        resolutionMinutes: DAY,
        defaultOwnerRole: "support",
    },
};

export const SUPPORT_CRITICAL_KEYWORDS = [
    "consumer court",
    "consumer forum",
    "legal action",
    "lawyer",
    "fraud",
    "scam",
    "police",
    "report you to",
    "media",
    "blog post",
    "viral",
    "twitter",
    "instagram",
];

export const SUPPORT_TEMPLATE_LIBRARY = {
    AUTO_ACK: `Hi [Customer Name],

Thanks for reaching out to Renivet. We've received your message and created ticket #[ID] to track it.

What happens next:
- A team member will respond personally within 2 hours during our working hours (10 AM - 8 PM IST, Mon-Sat).
- If you contacted us outside these hours, we'll respond by 10:30 AM the next working day.
- For urgent order issues, you can reply with "URGENT".

For reference, your ticket: #[ID]

Warmly,
Team Renivet`,
    ORDER_DELAY: `Hi [Customer Name],

Thank you for your patience with order #[ORDER_ID]. I'm sorry your order is taking longer than expected. Let me check directly with [BRAND_NAME] and get you a clear update by [SPECIFIC_TIME].

Best,
[YOUR NAME]
Customer Support - Renivet`,
    ORDER_NOT_RECEIVED: `Hi [Customer Name],

I'm really sorry to hear that order #[ORDER_ID] hasn't reached you despite being marked delivered. I'm filing a courier investigation, checking dispatch records, and coordinating internally.

I'll update you within 24 hours regardless.

Best,
[YOUR NAME]
Customer Support - Renivet`,
    PRODUCT_DAMAGED: `Hi [Customer Name],

I'm so sorry to see this. Please reply with 2-3 photos of the product damage, packaging condition, and shipping label. Once I have those, I'll process a full refund or replacement based on your preference.

Best,
[YOUR NAME]
Customer Support - Renivet`,
    REFUND_INITIATED: `Hi [Customer Name],

I've initiated your refund of [AMOUNT] for order #[ORDER_ID].

What to expect:
- Time to receive: 5-7 working days
- Reference: [REFUND_ID]

Warmly,
[YOUR NAME]
Customer Support - Renivet`,
    RETURN_DECLINED: `Hi [Customer Name],

Thank you for reaching out about [PRODUCT_NAME]. After reviewing your request, I'm unable to process a return in this case because [REASON].

Best,
[YOUR NAME]
Customer Support - Renivet`,
    BRAND_NON_RESPONSE: `Hi [Customer Name],

Following up on order #[ORDER_ID] and ticket #[TICKET_ID]. I've been in touch with [BRAND_NAME] but haven't received a clear timeline yet. I've escalated this internally and you'll hear from me by [SPECIFIC_TIME] either way.

Best,
[YOUR NAME]
Customer Support - Renivet`,
};

const SUPPORT_ISSUE_CATEGORY_MAP: Record<
    string,
    keyof typeof SUPPORT_CATEGORY_MATRIX
> = {
    order: "ORDER_DELAYED",
    shipping: "ORDER_DELAYED",
    payment: "PAYMENT_FAILED",
    product: "PRODUCT_NOT_AS_DESCRIBED",
    account: "ACCOUNT_LOGIN_ISSUE",
    other: "OTHER",
    where_is_my_order: "ORDER_DELAYED",
    wrong_item: "PRODUCT_WRONG_ITEM",
    item_damaged: "PRODUCT_DAMAGED",
    return_exchange: "RETURN_REQUEST",
    cancel_order: "ORDER_CANCEL_REQUEST",
    tracking_delay: "ORDER_DELAYED",
    not_delivered: "ORDER_NOT_RECEIVED",
    address_change: "ORDER_MODIFY_REQUEST",
    refund_status: "REFUND_STATUS",
    payment_failed: "PAYMENT_FAILED",
    double_charge: "PAYMENT_FAILED",
    product_info: "PRE_PURCHASE_QUERY",
    size_help: "SIZE_FIT_HELP",
    quality_issue: "PRODUCT_DEFECTIVE",
    login_issue: "ACCOUNT_LOGIN_ISSUE",
    profile_update: "ACCOUNT_LOGIN_ISSUE",
    general_query: "OTHER",
};

export function getSupportCategoryConfig(category?: string | null) {
    return (
        SUPPORT_CATEGORY_MATRIX[category ?? ""] ?? SUPPORT_CATEGORY_MATRIX.OTHER
    );
}

export function normalizeSupportCategory(input?: {
    category?: string | null;
    issueType?: string | null;
    text?: string | null;
}) {
    const criticalCategory = input?.text
        ? detectCriticalSupportCategory(input.text)
        : null;
    if (criticalCategory) return criticalCategory;

    const issueCategory = input?.issueType
        ? SUPPORT_ISSUE_CATEGORY_MAP[input.issueType]
        : null;
    if (issueCategory) return issueCategory;

    const category = input?.category;
    if (category && category in SUPPORT_CATEGORY_MATRIX) return category;

    return category
        ? (SUPPORT_ISSUE_CATEGORY_MAP[category] ?? "OTHER")
        : "OTHER";
}

export function normalizeSupportStatus(
    status?: string | null
): SupportTicketStatus {
    if (!status) return "new";
    if ((SUPPORT_TICKET_STATUSES as readonly string[]).includes(status)) {
        return status as SupportTicketStatus;
    }
    return LEGACY_SUPPORT_STATUS_MAP[status] ?? "new";
}

export function detectCriticalSupportCategory(text: string) {
    const lower = text.toLowerCase();
    if (
        [
            "consumer court",
            "consumer forum",
            "legal action",
            "lawyer",
            "police",
        ].some((item) => lower.includes(item))
    ) {
        return "LEGAL_THREAT";
    }
    if (
        ["viral", "media", "blog post", "twitter", "instagram"].some((item) =>
            lower.includes(item)
        )
    ) {
        return "SOCIAL_COMPLAINT";
    }
    if (SUPPORT_CRITICAL_KEYWORDS.some((item) => lower.includes(item))) {
        return "LEGAL_THREAT";
    }
    return null;
}

export function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

function isWorkingDay(date: Date) {
    return SUPPORT_WORKING_HOURS.workingDays.includes(date.getDay());
}

function isWithinWorkingHours(date: Date) {
    return (
        isWorkingDay(date) &&
        date.getHours() >= SUPPORT_WORKING_HOURS.startHour &&
        date.getHours() < SUPPORT_WORKING_HOURS.endHour
    );
}

export function nextWorkingHumanResponseStart(date = new Date()) {
    const result = new Date(date);
    while (!isWorkingDay(result)) {
        result.setDate(result.getDate() + 1);
    }
    result.setHours(
        SUPPORT_WORKING_HOURS.firstHumanResponseHour,
        SUPPORT_WORKING_HOURS.firstHumanResponseMinute,
        0,
        0
    );
    if (result <= date || date.getHours() >= SUPPORT_WORKING_HOURS.endHour) {
        do {
            result.setDate(result.getDate() + 1);
        } while (!isWorkingDay(result));
        result.setHours(
            SUPPORT_WORKING_HOURS.firstHumanResponseHour,
            SUPPORT_WORKING_HOURS.firstHumanResponseMinute,
            0,
            0
        );
    }
    return result;
}

export function calculateFirstResponseDueAt(
    category: string,
    createdAt = new Date()
) {
    const config = getSupportCategoryConfig(category);
    if (config.priority === "critical")
        return addMinutes(createdAt, config.firstResponseMinutes);
    if (isWithinWorkingHours(createdAt)) {
        return addMinutes(createdAt, config.firstResponseMinutes);
    }
    return nextWorkingHumanResponseStart(createdAt);
}

export function calculateResolutionDueAt(
    category: string,
    createdAt = new Date()
) {
    const config = getSupportCategoryConfig(category);
    return config.resolutionMinutes
        ? addMinutes(createdAt, config.resolutionMinutes)
        : null;
}

export function calculateCustomerUpdateDueAt(date = new Date()) {
    return addMinutes(date, 24 * HOUR);
}

export function calculateCustomerAutoCloseEligibleAt(date = new Date()) {
    return addMinutes(date, 7 * DAY);
}

export function calculateReopenAllowedUntil(date = new Date()) {
    return addMinutes(date, 14 * DAY);
}
