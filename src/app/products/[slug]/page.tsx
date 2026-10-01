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
  getProductIngredientNames,
  getRelatedProducts,
  ingredientMap,
  products,
  type Product,
} from "@/lib/catalog";
import { defaultOgImage, productCategories, siteConfig } from "@/lib/site";

type RouteProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [
    ...products.map((product) => ({ slug: product.slug })),
    ...productCategories.map((category) => ({ slug: category.slug })),
  ];
}

export const dynamicParams = false;

// Search traffic arrives on the molecule, not the brand: nobody looks up "SIZEDOB"
// unless they already hold the pack. Lead the title and description with the
// composition, trimmed to a character budget so the useful part survives truncation.
// The first ingredient is always kept, even when it alone exceeds the budget.
function getCompositionSummary(product: Product, budget: number) {
  const names = getProductIngredientNames(product);
  if (!names.length) return null;
  const summarise = (count: number) => {
    const kept = names.slice(0, count).join(", ");
    const omitted = names.length - count;
    return omitted > 0 ? `${kept} +${omitted} more` : kept;
  };
  for (let count = names.length; count > 1; count--) {
    const summary = summarise(count);
    if (summary.length <= budget) return summary;
  }
  return summarise(1);
}

// Product titles skip the site-name suffix (og:site_name carries the brand) so the
// composition gets the room.
const titleBudget = 60;

function getDosageFormLabel(product: Product) {
  return product.dosageForm.replaceAll("-", " ");
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = productCategories.find((item) => item.slug === slug);
  if (category) {
    const inCategory = products.filter((product) => product.category === category.slug);
    // Name real brands here so the category page can also be found by product query.
    const examples = inCategory.slice(0, 3).map((product) => product.name);
    const examplesText = examples.length ? `, including ${examples.join(", ")}` : "";
    const description = `${inCategory.length} Ramnova Healthcare ${category.label.toLowerCase()}${examplesText}. Composition and product information for each product.`;
    return {
      title: category.label,
      description,
      alternates: { canonical: `/products/${category.slug}/` },
      openGraph: {
        type: "website",
        url: `/products/${category.slug}/`,
        title: `${category.label} | Ramnova Healthcare`,
        description,
        images: [defaultOgImage],
      },
    };
  }

  const product = getProduct(slug);
  if (!product) return {};
  const productImages = getProductImages(product);
  // Budget the composition around the brand name and the parentheses.
  const titleComposition = getCompositionSummary(product, titleBudget - product.name.length - 3);
  const descriptionComposition = getCompositionSummary(product, 54);
  const title = titleComposition ? `${product.name} (${titleComposition})` : product.name;
  // Keep the whole description inside the ~155 characters Google will show.
  const subject = descriptionComposition
    ? `${getDosageFormLabel(product)} containing ${descriptionComposition}`
    : product.displayDescription;
  const description = `${product.name}: ${subject}. Composition and product information.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/products/${product.slug}/` },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      url: `/products/${product.slug}/`,
      title,
      description,
      images: productImages.map((image, index) => ({
        url: image,
        alt: index === 0 ? product.imageAlt : `${product.name} packaging view ${index + 1}`,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
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
  const externalSources = allSources.filter((source) => source.publisher !== siteConfig.legalName);
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
                  ["more-information", "More information"],
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

              <section className="info-block" id="more-information">
                <h2>More information</h2>
                <p>
                  For dosage, pack sizes or prescribing information, refer to the current pack
                  insert or contact Ramnova Healthcare. Catalogue information updated{" "}
                  {product.clinical.lastUpdated}.
                </p>
                {externalSources.length ? (
                  <ul className="references-list">
                    {externalSources.map((source) => (
                      <li key={`${source.url}-${source.title}`}>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.publisher}: {source.title}
                        </a>{" "}
                        ({source.jurisdiction}, accessed {source.accessedAt})
                      </li>
                    ))}
                  </ul>
                ) : null}
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
                <h2 className="section-title">Related products.</h2>
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
