import type { MetadataRoute } from "next";
import { getProductImages, products } from "@/lib/catalog";
import { productCategories, siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const latestProductDate = products.reduce(
    (latest, p) => (p.clinical.lastUpdated > latest ? p.clinical.lastUpdated : latest),
    "2026-09-24",
  );
  const catalogModified = new Date(`${latestProductDate}T00:00:00+05:30`);
  const staticModified = new Date("2026-09-24T00:00:00+05:30");
  const catalogPaths = new Set(["", "/products"]);
  const staticPages = ["", "/products", "/about", "/contact", "/privacy", "/medical-disclaimer"];
  return [
    ...staticPages.map((path) => ({
      url: `${siteConfig.url}${path}/`.replace("com//", "com/"),
      lastModified: catalogPaths.has(path) ? catalogModified : staticModified,
      changeFrequency: path === "/products" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.6,
    })),
    ...productCategories.map((category) => ({
      url: `${siteConfig.url}/products/${category.slug}/`,
      lastModified: catalogModified,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product.slug}/`,
      lastModified: new Date(`${product.clinical.lastUpdated}T00:00:00+05:30`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: getProductImages(product).map((image) => `${siteConfig.url}${image}`),
    })),
  ];
}
