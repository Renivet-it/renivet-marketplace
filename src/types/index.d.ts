import {
    RazorpayPaymentResponse,
    RazorpaySubscriptionResponse,
} from "@/lib/validations";

export type Permission = {
    name: string;
    description: string;
    bit: number;
};

export type RazorpayPaymentOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    notes: {
        [key: string]: string;
    };
    theme: {
        color: string;
    };
    handler: (response: RazorpayPaymentResponse) => Promise<void>;
    modal: {
        ondismiss: () => void;
    };
};

export type RazorpaySubscriptionOptions = {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    handler: (response: RazorpaySubscriptionResponse) => void;
    modal: {
        ondismiss: () => void;
    };
};
