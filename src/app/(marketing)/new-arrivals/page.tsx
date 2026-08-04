import { permanentRedirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewArrivalsRedirect({ searchParams }: PageProps) {
    const params = await searchParams;
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(key, item));
        } else if (value !== undefined) {
            query.set(key, value);
        }
    }

    const queryString = query.toString();
    permanentRedirect(`/swap-passport${queryString ? `?${queryString}` : ""}`);
}
