import { create } from "zustand";

export interface ChatProduct {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    price: number | null;
    compareAtPrice: number | null;
    brandName: string | null;
    categoryName: string | null;
    subcategoryName: string | null;
    productTypeName: string | null;
    image: string | null;
    similarity: number;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    products?: ChatProduct[];
    timestamp: number;
}

interface ChatStore {
    messages: ChatMessage[];
    isOpen: boolean;
    isLoading: boolean;
    addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
    setOpen: (open: boolean) => void;
    toggleOpen: () => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

let messageCounter = 0;

export const useChatStore = create<ChatStore>((set) => ({
    messages: [],
    isOpen: false,
    isLoading: false,
    addMessage: (message) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    id: `msg-${++messageCounter}-${Date.now()}`,
                    timestamp: Date.now(),
                },
            ],
        })),
    setOpen: (open) => set({ isOpen: open }),
    toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
    setLoading: (loading) => set({ isLoading: loading }),
    reset: () => set({ messages: [], isLoading: false }),
}));
