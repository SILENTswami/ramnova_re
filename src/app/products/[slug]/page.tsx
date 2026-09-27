import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Info,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { ProductMediaCarousel } from "@/components/product-media-carousel";
import {
  formatPrice,
  getCategoryLabel,
  getIngredientLabel,
  getProduct,
  getProductImages,
  getRelatedProducts,
  ingredientMap,
  products,
  type Product,
} from "@/lib/catalog";
import { productCategories, siteConfig } from "@/lib/site";

type RouteProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [
    ...products.map((product) => ({ slug: product.slug })),
    ...productCategories.map((category) => ({ slug: category.slug })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = productCategories.find((item) => item.slug === slug);
  if (category) {
    const count = products.filter((product) => product.category === category.slug).length;
    const description = `Explore ${count} Ramnova Healthcare ${category.label.toLowerCase()} with composition, product imagery and direct enquiry information.`;
    return {
      title: `${category.label} Products`,
      description,
      alternates: { canonical: `/products/${category.slug}/` },
      openGraph: {
        type: "website",
        url: `/products/${category.slug}/`,
        title: `${category.label} Products | Ramnova Healthcare`,
        description,
      },
    };
  }

  const product = getProduct(slug);
  if (!product) return {};
  const productImages = getProductImages(product);
  const description = `View composition, dosage form, product imagery and enquiry details for ${product.name}. Catalogue information only.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}/` },
    openGraph: {
      type: "website",
      url: `/products/${product.slug}/`,
      title: `${product.name} | Ramnova Healthcare`,
      description,
      images: productImages.map((image, index) => ({
        url: image,
        alt: index === 0 ? product.imageAlt : `${product.name} packaging view ${index + 1}`,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Ramnova Healthcare`,
      description,
      images: productImages,
    },
  };
}

function CategoryPage({ categorySlug }: { categorySlug: Product["category"] }) {
  const category = productCategories.find((item) => item.slug === categorySlug)!;
  const categoryProducts = products.filter((product) => product.category === categorySlug);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Ramnova ${category.label}`,
    url: `${siteConfig.url}/products/${category.slug}/`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: categoryProducts.length,
      itemListElement: categoryProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: `${siteConfig.url}/products/${product.slug}/`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products/" },
              { label: category.label },
            ]}
          />
          <h1 className="display-title">
            Ramnova <span className="gradient-text">{category.label.toLowerCase()}.</span>
          </h1>
          <div className="page-hero-copy">
            <p>
              Explore {categoryProducts.length} {category.label.toLowerCase()} with composition,
              packaging imagery and direct enquiry options.
            </p>
          </div>
        </div>
      </section>
      <Suspense fallback={<div className="catalog-section" aria-busy="true" />}>
        <CatalogExplorer initialCategory={categorySlug} />
      </Suspense>
    </>
  );
}

function ClinicalBlock({
  id,
  title,
  items,
  emptyText,
}: {
  id: string;
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <section className="info-block" id={id}>
      <h2>{title}</h2>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{emptyText}</p>
      )}
    </section>
  );
}

function ProductPage({ product }: { product: Product }) {
  const related = getRelatedProducts(product);
  const likelySupplement = [
    "Nutritional support",
    "Bone health and nutrition",
    "Vitamin D supplementation",
    "Iron and folate supplementation",
  ].includes(product.therapyCategory);
  const entityType = likelySupplement ? "DietarySupplement" : "Drug";
  const activeIngredients = product.variants.flatMap((variant) =>
    variant.ingredients.map((item) => getIngredientLabel(item)),
  );
  const allSources = [...product.sources, ...(product.clinical.sources ?? [])].filter(
    (source, index, list) => list.findIndex((item) => item.url === source.url) === index,
  );
  const productImages = getProductImages(product);

  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `${product.name} product information`,
    url: `${siteConfig.url}/products/${product.slug}/`,
    dateModified: product.clinical.lastUpdated,
    lastReviewed: product.clinical.reviewedBy ? product.clinical.lastUpdated : undefined,
    about: { "@id": `${siteConfig.url}/products/${product.slug}/#product` },
    mainEntity: {
      "@type": entityType,
      "@id": `${siteConfig.url}/products/${product.slug}/#product`,
      name: product.name,
      proprietaryName: entityType === "Drug" ? product.name : undefined,
      description: product.displayDescription,
      image: productImages.map((image) => `${siteConfig.url}${image}`),
      category: getCategoryLabel(product.category),
      dosageForm: entityType === "Drug" ? product.dosageForm : undefined,
      activeIngredient: activeIngredients,
      brand: { "@type": "Brand", name: siteConfig.name },
      manufacturer: { "@id": `${siteConfig.url}/#organization` },
      isProprietary: entityType === "Drug" ? true : undefined,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Products",
          item: `${siteConfig.url}/products/`,
        },
        { "@type": "ListItem", position: 3, name: product.name },
      ],
    },
    citation: allSources.map((source) => source.url),
  };

  return (
    <>
      <JsonLd data={schema} />
      <article>
        <header className="product-detail-hero">
          <div className="product-detail-grid">
            <div className="product-detail-media">
              <ProductMediaCarousel
                slug={product.slug}
                productName={product.name}
                image={product.image}
                imageAlt={product.imageAlt}
              />
            </div>
            <div className="product-detail-content">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Products", href: "/products/" },
                  { label: product.name },
                ]}
              />
              <p className="eyebrow light">{getCategoryLabel(product.category)}</p>
              <h1>{product.name}</h1>
              <p className="detail-composition">{product.displayDescription}</p>
              <div className="detail-meta">
                <span className="detail-chip">{product.therapyCategory}</span>
                <span className="detail-chip">{product.dosageForm.replaceAll("-", " ")}</span>
              </div>
              <div className="detail-price-row">
                <div>
                  <span className="detail-price-label">Catalogue price</span>
                  <span className="detail-price">{formatPrice(product)}</span>
                </div>
                <a className="button button-primary" href={siteConfig.whatsappHref}>
                  Product enquiry <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </header>

        <aside className="medical-note">
          <div className="shell medical-note-inner">
            <Info size={20} aria-hidden="true" />
            <span>
              <strong>Important medical information.</strong> This catalogue is for product
              information only and is not medical advice. Do not start, stop or substitute a
              medicine based on this page. Consult a qualified healthcare professional and the
              current pack insert.
            </span>
          </div>
        </aside>

        <section className="product-info-section">
          <div className="shell product-info-grid">
            <aside className="product-info-nav">
              <p className="eyebrow">On this page</p>
              <h2>Product information</h2>
              <ul>
                {[
                  ["composition", "Composition"],
                  ["overview", "Overview"],
                  ["uses", "Uses"],
                  ["safety", "Safety information"],
                  ["references", "References"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <a href={`#${href}`}>
                      {label} <ChevronRight size={14} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            <div>
              <section className="info-block" id="composition">
                <h2>Composition and variants</h2>
                {product.variants.map((variant) => (
                  <div key={variant.id}>
                    <p>
                      <strong>{variant.label}</strong>
                    </p>
                    <div className="ingredient-table-wrap" tabIndex={0}>
                    <table className="ingredient-table">
                      <thead>
                        <tr>
                          <th>Ingredient</th>
                          <th>Strength</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variant.ingredients.map((item) => {
                          const ingredient = ingredientMap.get(item.ingredientId);
                          return (
                            <tr key={`${variant.id}-${item.ingredientId}`}>
                              <td>{ingredient?.name ?? item.ingredientId}</td>
                              <td>
                                {item.strength
                                  ? `${item.strength.amount} ${item.strength.unit}`
                                  : "Not provided"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ))}
              </section>

              <section className="info-block" id="overview">
                <h2>Overview</h2>
                <p>{product.clinical.summary}</p>
                <p>
                  Therapy category: <strong>{product.therapyCategory}</strong>.
                </p>
                {product.clinical.scopeNote ? <p>{product.clinical.scopeNote}</p> : null}
              </section>

              <ClinicalBlock
                id="uses"
                title="Uses"
                items={product.clinical.uses}
                emptyText="Product-specific uses are not currently listed. Refer to the current pack insert and a qualified healthcare professional."
              />

              <section className="info-block" id="safety">
                <h2>Safety information</h2>
                <p>
                  Safety details must be checked against the current pack insert and advice from a
                  qualified healthcare professional.
                </p>
                {[
                  ["Warnings", product.clinical.warnings],
                  ["Common and serious side effects", product.clinical.sideEffects],
                  ["Contraindications", product.clinical.contraindications],
                  ["Important interactions", product.clinical.interactions],
                ].map(([label, values]) => (
                  <div key={label as string}>
                    <h3>{label as string}</h3>
                    {(values as string[]).length ? (
                      <ul>
                        {(values as string[]).map((value) => (
                          <li key={value}>{value}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Not currently listed. Refer to the current pack insert.</p>
                    )}
                  </div>
                ))}
              </section>

              <section className="info-block" id="references">
                <h2>References</h2>
                <p>Catalogue information updated {product.clinical.lastUpdated}.</p>
                <ul className="references-list">
                  {allSources.map((source) => (
                    <li key={`${source.url}-${source.title}`}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.publisher}: {source.title}
                      </a>{" "}
                      ({source.jurisdiction}, accessed {source.accessedAt})
                    </li>
                  ))}
                </ul>
                <Link className="text-link" href="/medical-disclaimer/">
                  Read the medical disclaimer <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </section>
            </div>
          </div>
        </section>
      </article>

      {related.length ? (
        <section className="section portfolio-section">
          <div className="shell">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Continue exploring</p>
                <h2 className="section-title">Related catalogue entries.</h2>
              </div>
              <Link className="text-link" href="/products/">
                Full catalogue <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="product-grid">
              {related.map((item, index) => (
                <ProductCard key={item.slug} product={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default async function ProductOrCategoryPage({ params }: RouteProps) {
  const { slug } = await params;
  const category = productCategories.find((item) => item.slug === slug);
  if (category) return <CategoryPage categorySlug={category.slug} />;

  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductPage product={product} />;
}
