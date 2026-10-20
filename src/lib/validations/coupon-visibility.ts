/** Returns whether a coupon belongs in public coupon suggestions. */
export function shouldExposeCouponPublicly(isCreatorCoupon: boolean) {
    return !isCreatorCoupon;
}
