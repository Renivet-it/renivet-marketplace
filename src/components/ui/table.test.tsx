import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Table } from "./table";

test("table accepts a bounded scroll container class", () => {
    const html = renderToStaticMarkup(
        <Table containerClassName="max-h-[70vh] overscroll-contain">
            <tbody>
                <tr>
                    <td>Product</td>
                </tr>
            </tbody>
        </Table>
    );

    expect(html).toContain(
        '<div class="relative w-full overflow-auto max-h-[70vh] overscroll-contain">'
    );
    expect(html).not.toContain("containerClassName=");
});
