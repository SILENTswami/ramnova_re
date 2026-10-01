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
import { QuickTips, SafetyAdvicePanel } from "@/components/product-safety";
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
// The first ingredient is always kept, even when it alone exceeds the budget. In prose,
// names are lowercased and a complete list ends "x and y".
function getCompositionSummary(product: Product, budget: number, prose = false) {
  const names = getProductIngredientNames(product).map((name) =>
    prose ? toLowerCaseWords(name) : name,
  );
  if (!names.length) return null;
  const summarise = (count: number) => {
    const omitted = names.length - count;
    if (omitted > 0) return `${names.slice(0, count).join(", ")} +${omitted} more`;
    if (prose && count > 1) {
      return `${names.slice(0, count - 1).join(", ")} and ${names[count - 1]}`;
    }
    return names.slice(0, count).join(", ");
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

// Lowercase capitalised words so a name reads mid-sentence. Acronyms, tokens with
// digits ("Q10", "K2-7") and letter prefixes ("L-carnitine") keep their case.
function toLowerCaseWords(name: string) {
  return name
    .split(" ")
    .map((word) => (/^[A-Z][a-z][a-z-]*$/.test(word) ? word.toLowerCase() : word))
    .join(" ");
}

// Lowercase a use's leading word so it reads mid-sentence, leaving acronyms alone.
function toSentenceCase(use: string) {
  const firstWord = use.split(" ")[0];
  return firstWord === firstWord.toUpperCase() ? use : use[0].toLowerCase() + use.slice(1);
}

const descriptionBudget = 155;

// Keep the whole description inside the ~155 characters Google will show. Lead with the
// conditions a product is used for when they are listed: drop the second use first, then
// shorten the composition, before giving up on uses altogether.
function getProductDescription(product: Product) {
  const { clinical } = product;
  const dosageForm = getDosageFormLabel(product);
  const uses = (clinical.seoUses ?? clinical.uses.map(toSentenceCase)).slice(0, 2);
  const hasSafety = [clinical.sideEffects, clinical.warnings, clinical.interactions].some(
    (items) => items.length > 0,
  );
  const ending = hasSafety
    ? "Uses, side effects, warnings and interactions."
    : "Uses and composition.";

  const attempts = [
    { uses, shorten: false },
    { uses: uses.slice(0, 1), shorten: false },
    { uses: uses.slice(0, 1), shorten: true },
  ];
  for (const attempt of attempts) {
    if (!attempt.uses.length) break;
    const purpose = ` for ${attempt.uses.join(" and ")}`;
    const fixedLength = `${product.name}: ${dosageForm} containing ${purpose}. ${ending}`.length;
    const composition = getCompositionSummary(
      product,
      attempt.shorten ? descriptionBudget - fixedLength : Infinity,
      true,
    );
    if (!composition) break;
    const description = `${product.name}: ${dosageForm} containing ${composition}${purpose}. ${ending}`;
    if (description.length <= descriptionBudget) return description;
  }

  const composition = getCompositionSummary(product, 54, true);
  const subject = composition ? `${dosageForm} containing ${composition}` : product.displayDescription;
  return `${product.name}: ${subject}. Composition and product information.`;
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
  const title = titleComposition ? `${product.name} (${titleComposition})` : product.name;
  const description = getProductDescription(product);
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

function ProductPage({ product }: { product: Product }) {
  const related = getRelatedProducts(product);
  const entityType = product.schemaType;
  const activeIngredients = product.variants.flatMap((variant) =>
    variant.ingredients.map((item) => getIngredientLabel(item)),
  );
  const allSources = [...product.sources, ...(product.clinical.sources ?? [])].filter(
    (source, index, list) => list.findIndex((item) => item.url === source.url) === index,
  );
  const externalSources = allSources.filter((source) => source.publisher !== siteConfig.legalName);
  const productImages = getProductImages(product);
  const { clinical } = product;
  const benefits = clinical.benefits ?? [];
  const safetyAdvice = clinical.safetyAdvice ?? [];
  const quickTips = clinical.quickTips ?? [];
  // Warnings and interactions lists only the groups a product has; with none, the section
  // keeps just its pack-insert line.
  const safetyGroups = (
    [
      ["Warnings", clinical.warnings],
      ["Contraindications", clinical.contraindications],
      ["Important interactions", clinical.interactions],
    ] as const
  ).filter(([, values]) => values.length > 0);
  // Optional sections, and their "On this page" entries, appear only when they have data.
  const sections = [
    ["composition", "Composition"],
    ["introduction", "Product introduction"],
    ...(clinical.uses.length ? [["uses", "Uses"]] : []),
    ...(benefits.length ? [["benefits", "Benefits"]] : []),
    ...(clinical.sideEffects.length ? [["side-effects", "Side effects"]] : []),
    ...(clinical.howToUse ? [["how-to-use", "How to use"]] : []),
    ...(clinical.howItWorks ? [["how-it-works", "How it works"]] : []),
    ...(safetyAdvice.length ? [["safety-advice", "Safety advice"]] : []),
    ...(quickTips.length ? [["quick-tips", "Quick tips"]] : []),
    ["safety", "Warnings and interactions"],
    ["more-information", "More information"],
  ];

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
      // Brand only: some products are made by contract manufacturers, so Ramnova is not
      // claimed as the manufacturer.
      brand: { "@type": "Brand", name: siteConfig.name },
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
                {sections.map(([href, label]) => (
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
                            <tr
                              key={`${variant.id}-${item.ingredientId}`}
                              className={item.partOf ? "ingredient-component" : undefined}
                            >
                              <td>
                                {item.partOf ? "of which " : null}
                                {ingredient?.name ?? item.ingredientId}
                                {item.qualifier ? (
                                  <span className="ingredient-qualifier">{item.qualifier}</span>
                                ) : null}
                              </td>
                              <td className="ingredient-strength">
                                {item.strength ? (
                                  `${item.strength.amount} ${item.strength.unit}`
                                ) : (
                                  <>
                                    <span aria-hidden="true">—</span>
                                    <span className="sr-only">Not stated</span>
                                  </>
                                )}
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

              <section className="info-block" id="introduction">
                <h2>Product introduction</h2>
                {(clinical.introduction ?? [clinical.summary]).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <p>
                  Therapy category: <strong>{product.therapyCategory}</strong>.
                </p>
                {clinical.scopeNote ? <p>{clinical.scopeNote}</p> : null}
              </section>

              {clinical.uses.length ? (
                <section className="info-block" id="uses">
                  <h2>Uses</h2>
                  <ul>
                    {clinical.uses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {benefits.length ? (
                <section className="info-block" id="benefits">
                  <h2>Benefits</h2>
                  {benefits.map(({ use, text }) => (
                    <div key={use}>
                      <h3>{use}</h3>
                      <p>{text}</p>
                    </div>
                  ))}
                </section>
              ) : null}

              {clinical.sideEffects.length ? (
                <section className="info-block" id="side-effects">
                  <h2>Side effects</h2>
                  <p>
                    Most side effects are mild and settle as your body adjusts. Tell your doctor if
                    they continue or worry you.
                  </p>
                  <ul>
                    {clinical.sideEffects.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {clinical.howToUse ? (
                <section className="info-block" id="how-to-use">
                  <h2>How to use</h2>
                  <p>{clinical.howToUse}</p>
                </section>
              ) : null}

              {clinical.howItWorks ? (
                <section className="info-block" id="how-it-works">
                  <h2>How it works</h2>
                  <p>{clinical.howItWorks}</p>
                </section>
              ) : null}

              {safetyAdvice.length ? <SafetyAdvicePanel advice={safetyAdvice} /> : null}
              {quickTips.length ? <QuickTips tips={quickTips} /> : null}

              <section className="info-block" id="safety">
                <h2>Warnings and interactions</h2>
                <p>
                  Safety details must be checked against the current pack insert and advice from a
                  qualified healthcare professional.
                </p>
                {safetyGroups.map(([label, values]) => (
                  <div key={label}>
                    <h3>{label}</h3>
                    <ul>
                      {values.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
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
