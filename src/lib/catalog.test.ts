import { describe, expect, it } from "vitest";
import {
  formatPrice,
  getPrimaryProductImage,
  getProduct,
  getProductImages,
  products,
  searchProducts,
} from "@/lib/catalog";

describe("catalog data", () => {
  it("contains the 22 catalogue products", () => {
    expect(products).toHaveLength(22);
    expect(new Set(products.map((product) => product.slug)).size).toBe(22);
  });

  it("lists products alphabetically by name", () => {
    const names = products.map((product) => product.name);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, "en", { numeric: true, sensitivity: "base", ignorePunctuation: true }),
    );
    expect(names).toEqual(sorted);
    expect(names.indexOf("RAMOMIN-200")).toBeLessThan(names.indexOf("RAMOMIN-400"));
  });

  it("formats a missing price as a contact action", () => {
    expect(formatPrice(products[0])).toBe("Contact for price");
  });

  it("resolves product slugs", () => {
    expect(getProduct("ruskirab-dsr")?.name).toBe("RUSKIRAB-DSR");
  });

  it("normalizes string and array product images", () => {
    expect(getProductImages({ image: "/images/products/front.webp" })).toEqual([
      "/images/products/front.webp",
    ]);
    expect(
      getProductImages({
        image: ["/images/products/front.webp", "/images/products/back.webp"],
      }),
    ).toEqual(["/images/products/front.webp", "/images/products/back.webp"]);
    expect(
      getPrimaryProductImage({
        image: ["/images/products/front.webp", "/images/products/back.webp"],
      }),
    ).toBe("/images/products/front.webp");
  });
});

describe("ingredient-aware search", () => {
  const expectedParacetamolProducts = ["ACEORAM-P", "ACEORAM-SP"];

  // Skipped since the 2026-09-28 catalogue revision: the only paracetamol products were
  // retired, so these aliases resolve to an empty product list. Restore if one returns.
  it.skip.each(["dolo", "paracetamol", "acetaminophen"])(
    "maps %s to paracetamol-containing products",
    (query) => {
      const result = searchProducts(query);
      expect(result.products.map((product) => product.name)).toEqual(expectedParacetamolProducts);
      expect(result.resolvedIngredientId).toBe("paracetamol");
      expect(result.caution?.toLowerCase()).toContain("ingredient");
    },
  );

  it("finds an exact brand", () => {
    expect(searchProducts("ESORUSK-D").products[0]?.name).toBe("ESORUSK-D");
  });

  it("supports typo-tolerant brand search", () => {
    expect(searchProducts("ruskirab dsr").products.some((product) => product.name === "RUSKIRAB-DSR")).toBe(true);
  });

  it("finds products by a pack-confirmed ingredient", () => {
    expect(searchProducts("gabapentin").products.map((product) => product.slug)).toContain("gabasram-nt-100");
    expect(searchProducts("silymarin").products.map((product) => product.slug)).toEqual(
      expect.arrayContaining(["siliram-max", "heptaram"]),
    );
  });

  it("finds products by a visual-aid-listed ingredient", () => {
    expect(searchProducts("rifaximin").products.map((product) => product.slug)).toEqual([
      "ramomin-200",
      "ramomin-400",
    ]);
  });

  it("applies dosage-form filtering", () => {
    const result = searchProducts("", "injections");
    expect(result.products).toHaveLength(2);
    expect(result.products.every((product) => product.category === "injections")).toBe(true);
  });
});
