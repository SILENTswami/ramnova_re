import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getCategoryLabel, products, type Product } from "@/lib/catalog";
import { productCategories } from "@/lib/site";

// Server-rendered stand-in for CatalogExplorer, which needs the URL's search params and
// so only renders in the browser. It mirrors the explorer's markup so the static HTML
// lists every product (for crawlers and before hydration) without a layout jump.
export function CatalogFallback({
  initialCategory = "all",
}: {
  initialCategory?: Product["category"] | "all";
}) {
  const listed =
    initialCategory === "all"
      ? products
      : products.filter((product) => product.category === initialCategory);

  return (
    <section className="catalog-section" aria-labelledby="catalog-results-heading">
      <div className="shell">
        <div className="catalog-toolbar">
          <div className="search-wrap">
            <Search size={19} aria-hidden="true" />
            <input
              id="catalog-search"
              className="catalog-search"
              type="search"
              placeholder="Search Ramnova brands, ingredients or categories…"
              aria-label="Search products"
            />
          </div>

          <select
            className="category-select"
            aria-label="Filter by dosage form"
            defaultValue={initialCategory}
          >
            <option value="all">All dosage forms</option>
            {productCategories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="catalog-status" aria-live="polite">
          <p className="catalog-count" id="catalog-results-heading">
            {listed.length} {listed.length === 1 ? "product" : "products"}
            {initialCategory !== "all" ? ` in ${getCategoryLabel(initialCategory)}` : ""}
          </p>
        </div>

        <div className="catalog-grid">
          {listed.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
