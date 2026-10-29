export const MAX_BANNER_UPLOAD_BYTES = 3.75 * 1024 * 1024;
export const MAX_BANNER_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_BANNER_DIMENSION = 2560;

function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("The image could not be compressed."));
            },
            type,
            quality
        );
    });
}

export async function compressBannerImage(file: File): Promise<File> {
    if (file.size <= MAX_BANNER_UPLOAD_BYTES) return file;

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
        throw new Error("Choose a PNG or JPEG image to upload as a banner.");
    }

    if (typeof createImageBitmap !== "function") {
        throw new Error("This browser cannot compress the selected image.");
    }

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        bitmap.close();
        throw new Error("The selected image could not be processed.");
    }

    const maxDimension = Math.max(bitmap.width, bitmap.height);
    let scale = Math.min(1, MAX_BANNER_DIMENSION / maxDimension);
    let quality = 0.92;

    try {
        for (let attempt = 0; attempt < 14; attempt += 1) {
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

            const blob = await canvasToBlob(
                canvas,
                file.type,
                file.type === "image/jpeg" ? quality : undefined
            );

            if (blob.size <= MAX_BANNER_UPLOAD_BYTES) {
                return new File([blob], file.name, {
                    type: file.type,
                    lastModified: file.lastModified,
                });
            }

            if (file.type === "image/jpeg" && quality > 0.68) {
                quality = Math.max(0.68, quality - 0.08);
            } else {
                scale *= 0.85;
                quality = 0.92;
            }
        }
    } finally {
        bitmap.close();
    }

    throw new Error(
        "This image could not be reduced below 4 MB. Try a smaller image."
    );
}
