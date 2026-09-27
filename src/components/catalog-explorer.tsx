"use client";

import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import {
  getCategoryLabel,
  searchProducts,
  type Product,
} from "@/lib/catalog";
import { productCategories } from "@/lib/site";

type CatalogExplorerProps = {
  initialCategory?: Product["category"] | "all";
};

export function CatalogExplorer({ initialCategory = "all" }: CatalogExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<Product["category"] | "all">(
    initialCategory,
  );
  const [focused, setFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
    const currentUrl = searchParams.size ? `${pathname}?${searchParams.toString()}` : pathname;
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [pathname, query, router, searchParams]);

  const result = useMemo(
    () => searchProducts(deferredQuery, category),
    [deferredQuery, category],
  );
  const suggestions = result.products.slice(0, 5);
  const showSuggestions = focused && query.trim().length > 0 && suggestions.length > 0;

  function chooseSuggestion(product: Product) {
    setFocused(false);
    router.push(`/products/${product.slug}/`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((value) => (value + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((value) => (value <= 0 ? suggestions.length - 1 : value - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      setFocused(false);
      setActiveSuggestion(-1);
    }
  }

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
              value={query}
              placeholder="Search Ramnova brands, ingredients or categories…"
              aria-label="Search products"
              aria-autocomplete="list"
              aria-controls={showSuggestions ? listboxId : undefined}
              aria-expanded={showSuggestions}
              aria-activedescendant={
                activeSuggestion >= 0 ? `${listboxId}-${activeSuggestion}` : undefined
              }
              role="combobox"
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveSuggestion(-1);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 140)}
              onKeyDown={onKeyDown}
            />
            {query ? (
              <button
                className="clear-search"
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}

            {showSuggestions ? (
              <div className="search-suggestions" id={listboxId} role="listbox">
                {result.explanation ? (
                  <div className="suggestion-note">
                    <strong>{result.explanation}</strong> {result.caution}
                  </div>
                ) : null}
                {suggestions.map((product, index) => (
                  <button
                    key={product.slug}
                    id={`${listboxId}-${index}`}
                    className={`suggestion-item ${activeSuggestion === index ? "active" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={activeSuggestion === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(product)}
                  >
                    <span className="suggestion-copy">
                      <strong>{product.name}</strong>
                      <span className="suggestion-description">{product.displayDescription}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <select
            className="category-select"
            aria-label="Filter by dosage form"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as Product["category"] | "all")
            }
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
            {result.products.length} {result.products.length === 1 ? "product" : "products"}
            {category !== "all" ? ` in ${getCategoryLabel(category)}` : ""}
          </p>
          {result.explanation ? (
            <div className="alias-banner">
              <strong>{result.explanation}</strong> {result.caution}
            </div>
          ) : null}
        </div>

        {result.products.length ? (
          <div className="catalog-grid">
            {result.products.map((product, index) => (
              <ProductCard key={product.slug} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-inner">
              <SearchX size={38} aria-hidden="true" />
              <h2>No matching Ramnova product</h2>
              <p>
                Try a brand name, active ingredient, or dosage form. Ingredient matches are for
                product discovery and do not imply substitution.
              </p>
              <button className="button button-dark" type="button" onClick={() => setQuery("")}>
                Clear search
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
