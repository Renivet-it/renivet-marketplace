import { canPlaceCustomerOrder } from "../customer-order-access";

type OrderAccount = Parameters<typeof canPlaceCustomerOrder>[0];

export const CUSTOMER_ORDER_BLOCKED_MESSAGE =
    "Admin accounts cannot place customer orders";

export function getCustomerOrderGuardState(
    account: OrderAccount,
    isLoading = false
) {
    const isBlocked = isLoading || !canPlaceCustomerOrder(account);
    return {
        isBlocked,
        message: isLoading
            ? null
            : isBlocked
              ? CUSTOMER_ORDER_BLOCKED_MESSAGE
              : null,
    } as const;
}

export function useCustomerOrderGuard(
    account: OrderAccount,
    isLoading = false
) {
    return getCustomerOrderGuardState(account, isLoading);
}
