export function hasCartStock({
    stock,
    existingQuantity,
    requestedQuantity,
}: {
    stock: number;
    existingQuantity: number;
    requestedQuantity: number;
}) {
    return existingQuantity + requestedQuantity <= stock;
}

export function createSingleFlightGuard() {
    let active = false;

    return {
        async run<T>(operation: () => Promise<T>): Promise<T | undefined> {
            if (active) return undefined;

            active = true;
            try {
                return await operation();
            } finally {
                active = false;
            }
        },
    };
}
