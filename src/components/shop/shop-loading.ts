export function getSortLoadingDetail(
    currentValue: string,
    nextValue: string,
    nextLabel: string
) {
    return currentValue === nextValue ? null : nextLabel;
}
