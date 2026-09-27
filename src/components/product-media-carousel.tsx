import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ProductMediaCarouselProps = {
  slug: string;
  productName: string;
  image: string | string[];
  imageAlt: string;
};

export function ProductMediaCarousel({
  slug,
  productName,
  image,
  imageAlt,
}: ProductMediaCarouselProps) {
  const images = Array.isArray(image) ? image : [image];
  const hasMultipleImages = images.length > 1;

  return (
    <section
      className={`product-media-carousel ${hasMultipleImages ? "is-slider" : "is-static"}`}
      aria-label={`${productName} product artwork`}
      aria-roledescription={hasMultipleImages ? "carousel" : undefined}
      data-image-count={images.length}
    >
      <div className="product-media-track">
        {images.map((source, index) => {
          const slideId = `${slug}-image-${index + 1}`;
          const previousId = `${slug}-image-${index === 0 ? images.length : index}`;
          const nextId = `${slug}-image-${index + 1 === images.length ? 1 : index + 2}`;
          const alt = index === 0 ? imageAlt : `${productName} packaging view ${index + 1}`;

          return (
            <figure
              className="product-media-slide product-artwork-slide"
              id={slideId}
              key={`${source}-${index}`}
              aria-label={`${productName} product view ${index + 1} of ${images.length}`}
            >
              <span className="artwork-badge">
                Pack artwork shown for product identification
              </span>
              <Image
                src={source}
                alt={alt}
                width={1200}
                height={900}
                priority={index === 0}
                sizes="(max-width: 800px) 100vw, 46vw"
              />

              {hasMultipleImages ? (
                <figcaption className="product-media-controls">
                  <a href={`#${previousId}`} aria-label="Previous product image">
                    <ChevronLeft size={18} aria-hidden="true" />
                  </a>
                  <span className="product-media-count">
                    {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                  </span>
                  <span className="product-media-jumps" aria-label="Choose product image">
                    {images.map((_, jumpIndex) => (
                      <a
                        key={`${slug}-jump-${jumpIndex}`}
                        href={`#${slug}-image-${jumpIndex + 1}`}
                        aria-label={`Show product image ${jumpIndex + 1}`}
                        aria-current={jumpIndex === index ? "true" : undefined}
                      >
                        <span className="sr-only">Image {jumpIndex + 1}</span>
                      </a>
                    ))}
                  </span>
                  <a href={`#${nextId}`} aria-label="Next product image">
                    <ChevronRight size={18} aria-hidden="true" />
                  </a>
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
