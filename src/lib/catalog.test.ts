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
  it("contains the 27 migrated products", () => {
    expect(products).toHaveLength(27);
    expect(new Set(products.map((product) => product.slug)).size).toBe(27);
  });

  it("formats a missing price as a contact action", () => {
    expect(formatPrice(products[0])).toBe("Contact for price");
  });

  it("resolves product slugs", () => {
    expect(getProduct("aceoram-p")?.name).toBe("ACEORAM-P");
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

  it.each(["dolo", "paracetamol", "acetaminophen"])(
    "maps %s to paracetamol-containing products",
    (query) => {
      const result = searchProducts(query);
      expect(result.products.map((product) => product.name)).toEqual(expectedParacetamolProducts);
      expect(result.resolvedIngredientId).toBe("paracetamol");
      expect(result.caution?.toLowerCase()).toContain("ingredient");
    },
  );

  it("finds an exact brand", () => {
    expect(searchProducts("CADISUN-D3").products[0]?.name).toBe("CADISUN-D3");
  });

  it("supports typo-tolerant brand search", () => {
    expect(searchProducts("aceoram sp").products.some((product) => product.name === "ACEORAM-SP")).toBe(true);
  });

  it("applies dosage-form filtering", () => {
    const result = searchProducts("", "injections");
    expect(result.products).toHaveLength(2);
    expect(result.products.every((product) => product.category === "injections")).toBe(true);
  });
});
