import { BrandMediaItem } from "@/lib/validations";

export function uniqueSelectedMedia(items: BrandMediaItem[]) {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function removeSelectedMedia(items: BrandMediaItem[], mediaId: string) {
    return items.filter((item) => item.id !== mediaId);
}

export function moveSelectedMedia(
    items: BrandMediaItem[],
    index: number,
    offset: -1 | 1
) {
    const nextIndex = index + offset;
    if (
        index < 0 ||
        index >= items.length ||
        nextIndex < 0 ||
        nextIndex >= items.length
    ) {
        return items;
    }

    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    return next;
}
