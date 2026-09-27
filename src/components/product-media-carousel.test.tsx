import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductMediaCarousel } from "@/components/product-media-carousel";

describe("ProductMediaCarousel", () => {
  it("renders every array image and native anchor navigation in static HTML", () => {
    const html = renderToStaticMarkup(
      <ProductMediaCarousel
        slug="sample"
        productName="Sample"
        image={["/images/products/front.webp", "/images/products/back.webp"]}
        imageAlt="Sample front packaging"
      />,
    );

    expect(html).toContain("%2Fimages%2Fproducts%2Ffront.webp");
    expect(html).toContain("%2Fimages%2Fproducts%2Fback.webp");
    expect(html).toContain('href="#sample-image-1"');
    expect(html).toContain('href="#sample-image-2"');
    expect(html).toContain('data-image-count="2"');
  });

  it("renders a string image without carousel controls", () => {
    const html = renderToStaticMarkup(
      <ProductMediaCarousel
        slug="sample"
        productName="Sample"
        image="/images/products/front.webp"
        imageAlt="Sample front packaging"
      />,
    );

    expect(html).toContain('data-image-count="1"');
    expect(html).not.toContain("product-media-controls");
  });
});
