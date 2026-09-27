import Fuse from "fuse.js";
import productsData from "@/data/products.json";
import ingredientsData from "@/data/ingredients.json";
import aliasesData from "@/data/search-aliases.json";
import { productCategories } from "@/lib/site";

export type VerificationState =
  | "source-listed"
  | "partial-details"
  | "conflicting-or-incomplete-details"
  | string;

export type SourceReference = {
  id?: string;
  publisher: string;
  title: string;
  url: string;
  jurisdiction: string;
  accessedAt: string;
  revision?: string;
  sections?: string[];
  fieldsSupported?: string[];
};

export type IngredientStrength = {
  amount: number;
  unit: string;
};

export type ProductIngredient = {
  ingredientId: string;
  strength: IngredientStrength | null;
  release?: string;
  sourceStrengthText?: string;
  verification: string;
};

export type ProductVariant = {
  id: string;
  label: string;
  ingredients: ProductIngredient[];
  verification: string;
};

export type ClinicalContent = {
  summary: string;
  uses: string[];
  sideEffects: string[];
  warnings: string[];
  contraindications: string[];
  interactions: string[];
  scopeNote?: string;
  fieldSources?: Record<string, string[]>;
  sources?: SourceReference[];
  reviewStatus: string;
  reviewedBy: string | null;
  lastUpdated: string;
};

export type Product = {
  slug: string;
  name: string;
  brandName: string;
  sourceDescription: string;
  displayDescription: string;
  category: "tablets" | "capsules" | "syrups" | "injections";
  dosageForm: string;
  image: string | string[];
  imageAlt: string;
  featured: boolean;
  therapyCategory: string;
  therapyCategoryVerification: string;
  variants: ProductVariant[];
  packaging: { description: string | null; verification: string };
  price: {
    amount: number | null;
    currency: "INR";
    packBasis: string | null;
    effectiveDate: string | null;
    verification: string;
  };
  clinical: ClinicalContent;
  verification: { status: VerificationState; notes: string[] };
  sources: SourceReference[];
};

export type Ingredient = {
  id: string;
  name: string;
  synonyms: string[];
  kind: string;
  medicalSummary: string;
  summaryStatus: string;
  references?: SourceReference[];
};

export type SearchAlias = {
  query: string;
  normalizedQuery: string;
  targetType: "ingredient";
  targetId: string;
  relationship: string;
  label: string;
  ingredientEquivalent: boolean;
  productEquivalent: boolean;
  nonEquivalenceNote: string;
  verification: string;
  references?: SourceReference[];
};

export const products = productsData as Product[];
export const ingredients = ingredientsData as Ingredient[];
export const searchAliases = aliasesData as SearchAlias[];

export const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

export function normalizeSearchTerm(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getCategoryLabel(category: Product["category"]) {
  return productCategories.find((item) => item.slug === category)?.label ?? category;
}

export function getProductIngredientIds(product: Product) {
  return Array.from(
    new Set(product.variants.flatMap((variant) => variant.ingredients.map((item) => item.ingredientId))),
  );
}

export function getProductIngredientNames(product: Product) {
  return getProductIngredientIds(product).map(
    (id) => ingredientMap.get(id)?.name ?? id.replaceAll("-", " "),
  );
}

export function getIngredientLabel(item: ProductIngredient) {
  const name = ingredientMap.get(item.ingredientId)?.name ?? item.ingredientId.replaceAll("-", " ");
  const strength = item.strength ? ` ${item.strength.amount} ${item.strength.unit}` : "";
  const release = item.release ? ` ${item.release}` : "";
  return `${name}${strength}${release}`;
}

export function getCompositionText(product: Product) {
  const firstVariant = product.variants[0];
  if (!firstVariant) return product.displayDescription;
  return firstVariant.ingredients.map(getIngredientLabel).join(" + ");
}

export function formatPrice(product: Product) {
  if (product.price.amount === null) return "Contact for price";
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: product.price.currency,
    maximumFractionDigits: 2,
  }).format(product.price.amount);
  return product.price.packBasis ? `${formatted} / ${product.price.packBasis}` : formatted;
}

export function getProductImages(product: Pick<Product, "image">) {
  return Array.isArray(product.image) ? product.image : [product.image];
}

export function getPrimaryProductImage(product: Pick<Product, "image">) {
  return getProductImages(product)[0];
}

export function productContainsIngredient(product: Product, ingredientId: string, verifiedOnly = false) {
  return product.variants.some((variant) =>
    variant.ingredients.some((item) => {
      if (item.ingredientId !== ingredientId) return false;
      if (!verifiedOnly) return true;
      return item.verification === "source-listed" || item.verification.startsWith("source-listed-");
    }),
  );
}

function resolveIngredient(query: string) {
  const normalized = normalizeSearchTerm(query);
  const explicitAlias = searchAliases.find(
    (alias) => normalizeSearchTerm(alias.normalizedQuery) === normalized,
  );
  if (explicitAlias) {
    return {
      ingredientId: explicitAlias.targetId,
      message: explicitAlias.label,
      caution: explicitAlias.nonEquivalenceNote,
      relationship: explicitAlias.relationship,
    };
  }

  const ingredient = ingredients.find((item) => {
    const terms = [item.id, item.name, ...item.synonyms].map(normalizeSearchTerm);
    return terms.includes(normalized);
  });
  if (!ingredient) return null;

  return {
    ingredientId: ingredient.id,
    message: `Showing Ramnova products that contain ${ingredient.name.toLowerCase()}.`,
    caution:
      "Ingredient matches are for discovery only. Products with a shared ingredient may have different strengths and additional ingredients.",
    relationship: "ingredient-match",
  };
}

type SearchDocument = {
  product: Product;
  name: string;
  description: string;
  therapy: string;
  dosageForm: string;
  ingredientNames: string;
  synonyms: string;
};

const searchDocuments: SearchDocument[] = products.map((product) => {
  const productIngredients = getProductIngredientIds(product)
    .map((id) => ingredientMap.get(id))
    .filter((item): item is Ingredient => Boolean(item));

  return {
    product,
    name: product.name,
    description: `${product.displayDescription} ${product.sourceDescription}`,
    therapy: product.therapyCategory,
    dosageForm: `${product.category} ${product.dosageForm}`,
    ingredientNames: productIngredients.map((item) => item.name).join(" "),
    synonyms: productIngredients.flatMap((item) => item.synonyms).join(" "),
  };
});

const fuse = new Fuse(searchDocuments, {
  threshold: 0.33,
  ignoreLocation: true,
  minMatchCharLength: 2,
  shouldSort: true,
  keys: [
    { name: "name", weight: 0.45 },
    { name: "ingredientNames", weight: 0.22 },
    { name: "synonyms", weight: 0.13 },
    { name: "therapy", weight: 0.1 },
    { name: "description", weight: 0.07 },
    { name: "dosageForm", weight: 0.03 },
  ],
});

export type ProductSearchResult = {
  products: Product[];
  explanation: string | null;
  caution: string | null;
  resolvedIngredientId: string | null;
};

export function searchProducts(query: string, category: Product["category"] | "all" = "all"): ProductSearchResult {
  const trimmed = query.trim();
  const ingredientResolution = trimmed ? resolveIngredient(trimmed) : null;
  let matches: Product[];

  if (ingredientResolution) {
    matches = products.filter((product) =>
      productContainsIngredient(product, ingredientResolution.ingredientId, true),
    );
  } else if (trimmed) {
    matches = fuse.search(trimmed).map((result) => result.item.product);
  } else {
    matches = products;
  }

  if (category !== "all") {
    matches = matches.filter((product) => product.category === category);
  }

  return {
    products: matches,
    explanation: ingredientResolution?.message ?? null,
    caution: ingredientResolution?.caution ?? null,
    resolvedIngredientId: ingredientResolution?.ingredientId ?? null,
  };
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 3) {
  const ingredientIds = new Set(getProductIngredientIds(product));
  return products
    .filter((candidate) => candidate.slug !== product.slug)
    .map((candidate) => ({
      product: candidate,
      score:
        (candidate.category === product.category ? 2 : 0) +
        getProductIngredientIds(candidate).filter((id) => ingredientIds.has(id)).length * 3,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
    .map((item) => item.product);
}
