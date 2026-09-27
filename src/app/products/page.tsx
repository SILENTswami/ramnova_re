import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { JsonLd } from "@/components/json-ld";
import { products } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

const description =
  "Search Ramnova Healthcare's complete catalogue of tablets, capsules, syrups and injections by brand, ingredient or dosage form.";

export const metadata: Metadata = {
  title: "Pharmaceutical Products",
  description,
  alternates: { canonical: "/products/" },
  openGraph: {
    type: "website",
    url: "/products/",
    title: "Pharmaceutical Products | Ramnova Healthcare",
    description,
  },
};

export default function ProductsPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ramnova Healthcare products",
    url: `${siteConfig.url}/products/`,
    description: metadata.description,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: `${siteConfig.url}/products/${product.slug}/`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={itemList} />
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products" }]} />
          <h1 className="display-title">
            Product <span className="gradient-text">catalogue.</span>
          </h1>
          <div className="page-hero-copy">
            <p>
              Browse {products.length} Ramnova products by brand, active ingredient or
              dosage form. Ingredient matches support discovery—not medicine substitution.
            </p>
          </div>
        </div>
      </section>
      <Suspense fallback={<div className="catalog-section" aria-busy="true" />}>
        <CatalogExplorer />
      </Suspense>
    </>
  );
}
