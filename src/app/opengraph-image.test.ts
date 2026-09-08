import { expect, test } from "bun:test";
import sharp from "sharp";

import OpenGraphImage from "./opengraph-image";

test("renders the Renivet brand mark instead of a letter avatar", async () => {
    const response = OpenGraphImage();
    const png = Buffer.from(await response.arrayBuffer());
    const { data, info } = await sharp(png)
        .extract({ left: 84, top: 72, width: 58, height: 58 })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    let brightPixels = 0;
    let darkPixels = 0;
    for (let index = 0; index < data.length; index += info.channels) {
        if (data[index] > 225 && data[index + 1] > 225 && data[index + 2] > 225) {
            brightPixels += 1;
        }
        if (data[index] < 60 && data[index + 1] < 60 && data[index + 2] < 60) {
            darkPixels += 1;
        }
    }

    const pixelCount = info.width * info.height;
    expect(brightPixels / pixelCount).toBeGreaterThan(0.7);
    expect(darkPixels / pixelCount).toBeWithin(0.05, 0.3);
});
