import { RazorpayResponse } from "@/lib/validations";

export type Permission = {
    name: string;
    description: string;
    bit: number;
};

export type RazorPayOptions = {
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
    handler: (response: RazorpayResponse) => Promise<void>;
    modal: {
        ondismiss: () => void;
    };
};
