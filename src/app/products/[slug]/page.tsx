import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Info,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { CatalogFallback } from "@/components/catalog-fallback";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { ProductMediaCarousel } from "@/components/product-media-carousel";
import { QuickTips, SafetyAdvicePanel } from "@/components/product-safety";
import {
  formatPrice,
  getCategoryLabel,
  getFamilySiblings,
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
  // A hand-written summary wins for products whose ingredient list is too long to name.
  if (product.seoComposition) {
    return prose ? toSentenceCase(product.seoComposition) : product.seoComposition;
  }
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

const descriptionBudget = 160;

// Meta description: "{seoName} by Ramnova Healthcare contains {composition} for {uses}.
// See uses, side effects, dosage and safety advice."
function getProductDescription(product: Product) {
  const { clinical } = product;
  const uses = (clinical.seoUses ?? clinical.uses.map(toSentenceCase)).slice(0, 2);
  const tail = "See uses, side effects, dosage and safety advice.";

  const tryDescription = (compositionBudget: number, usesList: string[]) => {
    const composition = getCompositionSummary(product, compositionBudget, true);
    if (!composition) return null;
    const purpose = usesList.length ? ` for ${usesList.join(" and ")}` : "";
    return `${product.seoName} by ${siteConfig.name} contains ${composition}${purpose}. ${tail}`;
  };

  const attempts = [
    { uses: uses, shorten: false },
    { uses: uses.slice(0, 1), shorten: false },
    { uses: uses.slice(0, 1), shorten: true },
    { uses: [], shorten: true },
  ];
  for (const attempt of attempts) {
    const purpose = attempt.uses.length ? ` for ${attempt.uses.join(" and ")}` : "";
    const fixedLength = `${product.seoName} by ${siteConfig.name} contains ${purpose}. ${tail}`.length;
    const budget = attempt.shorten ? descriptionBudget - fixedLength : Infinity;
    const desc = tryDescription(budget, attempt.uses);
    if (desc && desc.length <= descriptionBudget) return desc;
  }

  return `${product.seoName} by ${siteConfig.name}. ${tail}`;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = productCategories.find((item) => item.slug === slug);
  if (category) {
    const inCategory = products.filter((product) => product.category === category.slug);
    const seoBrands = inCategory.map((p) => p.seoBrand);
    const titleBrands = seoBrands.slice(0, 3);
    const titleSuffix = inCategory.length > 3 ? " & more" : "";
    const title = `Ramnova Healthcare ${category.label} – ${titleBrands.join(", ")}${titleSuffix}`;
    const descNames = inCategory.slice(0, 5).map((p) => p.seoName);
    const descMore = inCategory.length > 5 ? ` and ${inCategory.length - 5} more` : "";
    const description = `${inCategory.length} Ramnova Healthcare ${category.label.toLowerCase()}: ${descNames.join(", ")}${descMore}. Uses, side effects and composition for each product.`;
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: `/products/${category.slug}/` },
      openGraph: {
        type: "website",
        url: `/products/${category.slug}/`,
        title,
        description,
        images: [defaultOgImage],
      },
    };
  }

  const product = getProduct(slug);
  if (!product) return {};
  const productImages = getProductImages(product);
  const title = `${product.seoName}: Uses, Side Effects, Composition | ${siteConfig.name}`;
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
        alt: index === 0 ? `${product.seoName} pack – ${siteConfig.name}` : `${product.seoName} packaging view ${index + 1}`,
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
        name: product.seoName,
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
            <p>
              Ramnova {category.label.toLowerCase()} include{" "}
              {categoryProducts.map((p) => p.seoName).join(", ")}.
            </p>
          </div>
        </div>
      </section>
      <Suspense fallback={<CatalogFallback initialCategory={categorySlug} />}>
        <CatalogExplorer initialCategory={categorySlug} />
      </Suspense>
    </>
  );
}

type FaqItem = { question: string; answer: string };

// Lowercase the first character only when the second character isn't uppercase,
// preserving acronyms like COPD, QT, HIV, MAOI and prefixes like L-carnitine.
function lowerFirst(text: string) {
  if (!text) return text;
  const stripped = text.replace(/\.$/, "");
  if (stripped.length < 2) return stripped.toLowerCase();
  if (stripped[1] === stripped[1].toUpperCase() && stripped[1] !== stripped[1].toLowerCase()) {
    return stripped;
  }
  return stripped[0].toLowerCase() + stripped.slice(1);
}

// Join list items with "; " and "and" before the last, with a colon after the lead-in.
function joinList(items: string[]) {
  const cleaned = items.map(lowerFirst);
  if (cleaned.length === 1) return cleaned[0];
  return `${cleaned.slice(0, -1).join("; ")}; and ${cleaned[cleaned.length - 1]}`;
}

const dosageFormUnits: Record<string, string> = {
  tablet: "each tablet",
  "film-coated-tablet": "each film-coated tablet",
  "soft-gel-capsule": "each capsule",
  "sustained-release-capsule": "each capsule",
  "modified-release-capsule": "each capsule",
  injection: "each vial",
  syrup: "per 5 ml",
  "oral-suspension": "per 5 ml",
  "dry-syrup": "per 5 ml after mixing",
  powder: "per serving",
};

function getCompositionFaqAnswer(product: Product) {
  const { seoName } = product;
  const variant = product.variants[0];
  if (!variant) return null;
  const eligible = variant.ingredients.filter((item) => !item.partOf);
  const maxInline = 5;
  const showAll = eligible.length <= 6;
  const formatIngredient = (item: (typeof eligible)[number]) => {
    const name = ingredientMap.get(item.ingredientId)?.name ?? item.ingredientId.replaceAll("-", " ");
    const strength = item.strength ? ` ${item.strength.amount} ${item.strength.unit}` : "";
    const parts: string[] = [];
    if (item.qualifier) parts.push(item.qualifier);
    if (item.release) parts.push(item.release);
    const parenthetical = parts.length ? ` (${parts.join(", ")})` : "";
    return `${toLowerCaseWords(name)}${strength}${parenthetical}`;
  };
  const items = (showAll ? eligible : eligible.slice(0, maxInline)).map(formatIngredient);
  const remainder = eligible.length - maxInline;

  // Derive "in each tablet" / "per 5 ml" from the variant label or dosage form.
  const labelLower = variant.label.charAt(0).toLowerCase() + variant.label.slice(1);
  const unitMatch = labelLower.match(/^each\s+(.+?)\s+contains?$/i);
  const unit = unitMatch
    ? unitMatch[0].replace(/\s+contains?$/i, "")
    : dosageFormUnits[product.dosageForm] ?? null;
  const suffix = unit ? ` in ${unit}` : "";

  if (showAll) {
    const joined = items.length === 1
      ? items[0]
      : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
    return `${seoName} contains ${joined}${suffix}.`;
  }
  return `${seoName} contains ${items.join(", ")} and ${remainder} other vitamins, minerals and nutrients${suffix}; see the full composition table above.`;
}

function buildFaqs(product: Product): FaqItem[] {
  const { seoName } = product;
  const { clinical } = product;
  const faqs: FaqItem[] = [];

  if (clinical.uses.length) {
    faqs.push({
      question: `What is ${seoName} used for?`,
      answer: `${seoName} is used for: ${joinList(clinical.uses)}.`,
    });
  }
  if (clinical.sideEffects.length) {
    faqs.push({
      question: `What are the side effects of ${seoName}?`,
      answer: `Common side effects of ${seoName} include: ${joinList(clinical.sideEffects)}. Tell your doctor if they continue or worry you.`,
    });
  }
  if (clinical.howToUse) {
    faqs.push({
      question: `How should I take ${seoName}?`,
      answer: clinical.howToUse,
    });
  }
  if (clinical.contraindications.length) {
    faqs.push({
      question: `Who should not take ${seoName}?`,
      answer: `Do not take ${seoName} in the following cases: ${joinList(clinical.contraindications)}.`,
    });
  }

  const safetyMap = new Map(
    (clinical.safetyAdvice ?? []).map((a) => [a.topic, a]),
  );
  const alcoholAdvice = safetyMap.get("alcohol");
  if (alcoholAdvice) {
    faqs.push({
      question: `Can I drink alcohol with ${seoName}?`,
      answer: alcoholAdvice.note,
    });
  }
  const pregnancyAdvice = safetyMap.get("pregnancy");
  if (pregnancyAdvice) {
    faqs.push({
      question: `Is ${seoName} safe in pregnancy?`,
      answer: pregnancyAdvice.note,
    });
  }
  const drivingAdvice = safetyMap.get("driving");
  if (drivingAdvice) {
    faqs.push({
      question: `Can I drive after taking ${seoName}?`,
      answer: drivingAdvice.note,
    });
  }

  faqs.push({
    question: `Who markets ${seoName}?`,
    answer: `${product.seoBrand} is a registered product of ${siteConfig.legalName}, Silvassa, India, and is marketed by ${siteConfig.name}.`,
  });

  const compositionAnswer = getCompositionFaqAnswer(product);
  if (compositionAnswer) {
    faqs.push({
      question: `What is the composition of ${seoName}?`,
      answer: compositionAnswer,
    });
  }

  return faqs;
}

function ProductPage({ product }: { product: Product }) {
  const related = getRelatedProducts(product);
  const familySiblings = getFamilySiblings(product);
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
  const { seoName, seoBrand } = product;
  const benefits = clinical.benefits ?? [];
  const safetyAdvice = clinical.safetyAdvice ?? [];
  const quickTips = clinical.quickTips ?? [];
  const faqs = buildFaqs(product);
  // Warnings and interactions lists only the groups a product has; with none, the section
  // keeps just its pack-insert line.
  const safetyGroups = (
    [
      ["Warnings", clinical.warnings],
      ["Contraindications", clinical.contraindications],
      ["Important interactions", clinical.interactions],
    ] as const
  ).filter(([, values]) => values.length > 0);
  const familyLabel = product.family
    ? product.family.charAt(0).toUpperCase() + product.family.slice(1)
    : null;
  // Optional sections, and their "On this page" entries, appear only when they have data.
  // Nav uses short labels; rendered h2s include seoName for SEO.
  const sections = [
    ["composition", "Composition"],
    ...(familySiblings.length ? [["family", `${familyLabel} range`]] : []),
    ["introduction", "About"],
    ...(clinical.uses.length ? [["uses", "Uses"]] : []),
    ...(benefits.length ? [["benefits", "Benefits"]] : []),
    ...(clinical.sideEffects.length ? [["side-effects", "Side effects"]] : []),
    ...(clinical.howToUse ? [["how-to-use", "How to use"]] : []),
    ...(clinical.howItWorks ? [["how-it-works", "How it works"]] : []),
    ...(safetyAdvice.length ? [["safety-advice", "Safety advice"]] : []),
    ...(quickTips.length ? [["quick-tips", "Quick tips"]] : []),
    ["safety", "Warnings and interactions"],
    ...(faqs.length ? [["faqs", "FAQs"]] : []),
    ["more-information", "More information"],
  ];

  const alternateNames = Array.from(
    new Set([product.name, seoBrand, seoName]),
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `${seoName} product information`,
    url: `${siteConfig.url}/products/${product.slug}/`,
    dateModified: product.clinical.lastUpdated,
    lastReviewed: product.clinical.reviewedBy ? product.clinical.lastUpdated : undefined,
    about: { "@id": `${siteConfig.url}/products/${product.slug}/#product` },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    mainEntity: {
      "@type": entityType,
      "@id": `${siteConfig.url}/products/${product.slug}/#product`,
      name: seoName,
      alternateName: alternateNames,
      proprietaryName: entityType === "Drug" ? product.name : undefined,
      description: product.displayDescription,
      image: productImages.map((image) => `${siteConfig.url}${image}`),
      category: getCategoryLabel(product.category),
      dosageForm: entityType === "Drug" ? product.dosageForm : undefined,
      activeIngredient: activeIngredients,
      brand: { "@type": "Brand", name: seoBrand },
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
        { "@type": "ListItem", position: 3, name: seoName },
      ],
    },
    citation: allSources.map((source) => source.url),
  };

  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <>
      <JsonLd data={schema} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <article>
        <header className="product-detail-hero">
          <div className="product-detail-grid">
            <div className="product-detail-media">
              <ProductMediaCarousel
                slug={product.slug}
                productName={seoName}
                image={product.image}
                imageAlt={`${seoName} pack – ${siteConfig.name}`}
              />
            </div>
            <div className="product-detail-content">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Products", href: "/products/" },
                  { label: seoName },
                ]}
              />
              <p className="eyebrow light">{getCategoryLabel(product.category)}</p>
              <h1>{seoName}</h1>
              <p className="detail-composition">{product.displayDescription}</p>
              <p className="detail-brand-line">
                {seoBrand} is a registered product of {siteConfig.legalName}.
              </p>
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
                <h2>{seoName} composition</h2>
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
                        {variant.ingredients.map((item, index) => {
                          const ingredient = ingredientMap.get(item.ingredientId);
                          // Start a sub-heading row whenever the group changes.
                          const startsGroup =
                            item.group !== undefined &&
                            item.group !== variant.ingredients[index - 1]?.group;
                          return (
                            <Fragment key={`${variant.id}-${item.ingredientId}`}>
                            {startsGroup ? (
                              <tr className="ingredient-group">
                                <th colSpan={2} scope="colgroup">
                                  {item.group}
                                </th>
                              </tr>
                            ) : null}
                            <tr className={item.partOf ? "ingredient-component" : undefined}>
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
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ))}
              </section>

              {familySiblings.length ? (
                <section className="info-block" id="family">
                  <h2>Also in the {familyLabel} range</h2>
                  <ul>
                    {familySiblings.map((sibling) => (
                      <li key={sibling.slug}>
                        <Link className="text-link" href={`/products/${sibling.slug}/`}>
                          {sibling.seoName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="info-block" id="introduction">
                <h2>About {seoName}</h2>
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
                  <h2>Uses of {seoName}</h2>
                  <ul>
                    {clinical.uses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {benefits.length ? (
                <section className="info-block" id="benefits">
                  <h2>Benefits of {seoName}</h2>
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
                  <h2>Side effects of {seoName}</h2>
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
                  <h2>How to take {seoName}</h2>
                  <p>{clinical.howToUse}</p>
                </section>
              ) : null}

              {clinical.howItWorks ? (
                <section className="info-block" id="how-it-works">
                  <h2>How {seoName} works</h2>
                  <p>{clinical.howItWorks}</p>
                </section>
              ) : null}

              {safetyAdvice.length ? <SafetyAdvicePanel advice={safetyAdvice} seoName={seoName} /> : null}
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

              {faqs.length ? (
                <section className="info-block" id="faqs">
                  <h2>Frequently asked questions about {seoName}</h2>
                  <dl className="faq-list">
                    {faqs.map((faq) => (
                      <details key={faq.question}>
                        <summary>
                          <h3>{faq.question}</h3>
                        </summary>
                        <dd>{faq.answer}</dd>
                      </details>
                    ))}
                  </dl>
                </section>
              ) : null}

              <section className="info-block" id="more-information">
                <h2>More information</h2>
                <p>
                  Marketed by {siteConfig.legalName}, Silvassa, India.
                </p>
                <p>
                  For dosage, pack sizes or prescribing information, refer to the current pack
                  insert or contact {siteConfig.name}. Catalogue information updated{" "}
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
