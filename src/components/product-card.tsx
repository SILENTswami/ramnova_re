import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  formatPrice,
  getCategoryLabel,
  getPrimaryProductImage,
  type Product,
} from "@/lib/catalog";

export function ProductCard({ product, index }: { product: Product; index?: number }) {
  return (
    <Link className="product-card" href={`/products/${product.slug}/`}>
      <div className="product-card-image">
        {typeof index === "number" ? (
          <span className="product-card-index">{String(index + 1).padStart(2, "0")}</span>
        ) : null}
        <Image
          src={getPrimaryProductImage(product)}
          alt={product.imageAlt}
          width={640}
          height={640}
        />
      </div>
      <div className="product-card-body">
        <div className="product-card-kicker">
          <p className="product-card-category">
            {getCategoryLabel(product.category)} · {product.therapyCategory}
          </p>
        </div>
        <h3>{product.name}</h3>
        <p className="product-card-composition">{product.displayDescription}</p>
        <div className="product-card-footer">
          <span className="product-card-price">{formatPrice(product)}</span>
          <span className="product-card-arrow" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}
