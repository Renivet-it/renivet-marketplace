import { InferenceClient } from "@huggingface/inference";
import { db } from "@/lib/db";
import { products, brands, categories, subCategories, productTypes } from "@/lib/db/schema"; // Your schemas
import { eq } from "drizzle-orm";

const token = process.env.HF_TOKEN;
const client = new InferenceClient(token);

async function generateProductEmbeddings() {
  const allProducts = await db.query.products.findMany({
    columns: {
      id: true,
      title: true,
      description: true,
      sizeAndFit: true,
      materialAndCare: true,
      metaDescription: true,
      metaTitle: true,
    },
    with: {
      brand: {
        columns: { name: true },
      },
      category: {
        columns: { name: true },
      },
      subcategory: {
        columns: { name: true },
      },
      productType: {
        columns: { name: true },
      },
      specifications: {
        columns: {
          key: true,
          value: true,
        },
      },
    },
  });

  for (const product of allProducts) {
    // Combine specifications as "key:value" pairs
    const specsText = product.specifications
      .map((spec) => `${spec.key}:${spec.value}`)
      .join(" ");

    // Combine all relevant fields for embedding
    const text = [
      product.title,
      product.description || "",
      product.sizeAndFit || "",
      product.materialAndCare || "",
      product.metaDescription || "",
      product.metaTitle || "",
      product.brand?.name || "",
      product.category?.name || "",
      product.subcategory?.name || "",
      product.productType?.name || "",
      specsText,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!text) {
      await db
        .update(products)
        .set({ embeddings: null })
        .where(eq(products.id, product.id));
      continue;
    }

    try {
      // Generate embedding via Hugging Face Inference API
      const response = await client.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
      });

      // Extract the embedding array
      const embeddingArray = Array.isArray(response) ? response : (response as any).data;
      if (!Array.isArray(embeddingArray) || embeddingArray.length !== 384) {
        console.error(`Invalid embedding for product ${product.id}`);
        continue;
      }

      await db
        .update(products)
        .set({ embeddings: embeddingArray })
        .where(eq(products.id, product.id));
    } catch (error) {
      console.error(`Error generating embedding for product ${product.id}:`, error);
    }
  }
  console.log("Embeddings generated for all products");
}

generateProductEmbeddings().catch(console.error);