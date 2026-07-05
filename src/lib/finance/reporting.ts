export function toCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) return "";
    const headers = Array.from(
        rows.reduce((set, row) => {
            Object.keys(row).forEach((key) => set.add(key));
            return set;
        }, new Set<string>())
    );

    const escapeValue = (value: unknown) => {
        if (value === null || value === undefined) return "";
        const stringValue = String(value).replaceAll('"', '""');
        return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
    };

    const lines = [
        headers.join(","),
        ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(",")),
    ];
    return lines.join("\n");
}
