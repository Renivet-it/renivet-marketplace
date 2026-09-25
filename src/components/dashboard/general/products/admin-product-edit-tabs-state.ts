export type AdminProductEditTab = "qc" | "edit";

export function getDefaultAdminProductTab(
    requestedTab: string | null,
    requestedFocus: string | null
): AdminProductEditTab {
    return requestedTab === "qc" && requestedFocus !== "hsCode" ? "qc" : "edit";
}
