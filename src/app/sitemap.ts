import type { MetadataRoute } from "next"

// 👇 Default export is required
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://renivet.com"

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // add more URLs if needed
  ];
}
