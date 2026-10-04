import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const load = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const products = load("src/data/products.json");
const ingredients = load("src/data/ingredients.json");
const aliases = load("src/data/search-aliases.json");

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(products.length === 22, `Expected 22 products, found ${products.length}`);
const validCategories = new Set(["tablets", "capsules", "syrups", "injections", "powders"]);
const validSafetyTopics = new Set(["alcohol", "pregnancy", "breastfeeding", "driving", "kidney", "liver"]);
const validSafetyStatuses = new Set(["safe", "safe-if-prescribed", "caution", "consult", "unsafe"]);
const slugs = new Set();
const ingredientIds = new Set(ingredients.map((ingredient) => ingredient.id));

const featuredOrders = new Set();
for (const product of products) {
  if (product.featuredOrder !== undefined) {
    assert(product.featured === true, `${product.slug}: featuredOrder is set but the product is not featured`);
    assert(
      Number.isInteger(product.featuredOrder) && product.featuredOrder >= 1,
      `${product.slug}: featuredOrder must be a positive integer`,
    );
    assert(!featuredOrders.has(product.featuredOrder), `${product.slug}: duplicate featuredOrder ${product.featuredOrder}`);
    featuredOrders.add(product.featuredOrder);
  }
}

for (const product of products) {
  assert(typeof product.slug === "string" && /^[a-z0-9-]+$/.test(product.slug), `Invalid slug: ${product.slug}`);
  assert(!slugs.has(product.slug), `Duplicate product slug: ${product.slug}`);
  slugs.add(product.slug);
  assert(validCategories.has(product.category), `${product.slug}: invalid category ${product.category}`);
  assert(
    product.schemaType === "Drug" || product.schemaType === "DietarySupplement",
    `${product.slug}: schemaType must be "Drug" or "DietarySupplement"`,
  );
  assert(
    typeof product.seoBrand === "string" && product.seoBrand.length > 0,
    `${product.slug}: seoBrand must be a non-empty string`,
  );
  assert(
    typeof product.seoName === "string" && product.seoName.length > 0,
    `${product.slug}: seoName must be a non-empty string`,
  );
  if (product.family !== undefined) {
    assert(
      typeof product.family === "string" && /^[a-z0-9-]+$/.test(product.family),
      `${product.slug}: family must be a lowercase kebab-case string`,
    );
  }
  if (product.seoComposition !== undefined) {
    assert(
      typeof product.seoComposition === "string" && product.seoComposition.length > 0,
      `${product.slug}: seoComposition must be a non-empty string`,
    );
  }
  const imagePaths =
    typeof product.image === "string"
      ? [product.image]
      : Array.isArray(product.image)
        ? product.image
        : [];
  assert(
    typeof product.image === "string" || (Array.isArray(product.image) && product.image.length > 0),
    `${product.slug}: image must be a string or a non-empty array of strings`,
  );
  assert(
    imagePaths?.[0] === `/images/products/${product.slug}.webp`,
    `${product.slug}: first image path must follow slug convention`,
  );
  for (const imagePath of imagePaths ?? []) {
    assert(typeof imagePath === "string", `${product.slug}: every image must be a string`);
    assert(
      typeof imagePath === "string" && imagePath.startsWith("/images/products/"),
      `${product.slug}: image must use /images/products/`,
    );
    assert(
      typeof imagePath === "string" && existsSync(resolve(root, `public${imagePath}`)),
      `${product.slug}: missing image ${imagePath}`,
    );
  }
  assert(Array.isArray(product.variants) && product.variants.length > 0, `${product.slug}: needs a variant`);
  assert(Array.isArray(product.sources) && product.sources.length > 0, `${product.slug}: needs a source`);
  assert(product.price?.currency === "INR", `${product.slug}: price currency must be INR`);
  assert(product.price?.amount === null || (typeof product.price.amount === "number" && product.price.amount >= 0), `${product.slug}: price must be null or non-negative`);

  for (const variant of product.variants ?? []) {
    assert(Array.isArray(variant.ingredients) && variant.ingredients.length > 0, `${product.slug}/${variant.id}: needs ingredients`);
    const listedBefore = new Set();
    for (const ingredient of variant.ingredients ?? []) {
      assert(ingredientIds.has(ingredient.ingredientId), `${product.slug}: unknown ingredient ${ingredient.ingredientId}`);
      if (ingredient.partOf !== undefined) {
        assert(listedBefore.has(ingredient.partOf), `${product.slug}: ${ingredient.ingredientId} is part of ${ingredient.partOf}, which must be listed before it`);
      }
      listedBefore.add(ingredient.ingredientId);
      if (ingredient.strength) {
        assert(typeof ingredient.strength.amount === "number" && ingredient.strength.amount >= 0, `${product.slug}: invalid strength amount`);
        assert(typeof ingredient.strength.unit === "string" && ingredient.strength.unit.length > 0, `${product.slug}: invalid strength unit`);
      }
    }
  }

  for (const field of ["uses", "sideEffects", "warnings", "contraindications", "interactions"]) {
    assert(Array.isArray(product.clinical?.[field]), `${product.slug}: clinical.${field} must be an array`);
  }

  const { introduction, benefits, howToUse, howItWorks, safetyAdvice, quickTips } =
    product.clinical ?? {};
  const isText = (value) => typeof value === "string" && value.length > 0;
  if (introduction !== undefined) {
    assert(
      Array.isArray(introduction) && introduction.length > 0 && introduction.every(isText),
      `${product.slug}: clinical.introduction must be an array of non-empty strings`,
    );
  }
  if (benefits !== undefined) {
    assert(
      Array.isArray(benefits) && benefits.every((benefit) => isText(benefit?.use) && isText(benefit?.text)),
      `${product.slug}: clinical.benefits need a non-empty use and text`,
    );
  }
  for (const [field, value] of [["howToUse", howToUse], ["howItWorks", howItWorks]]) {
    if (value !== undefined) assert(isText(value), `${product.slug}: clinical.${field} must be a non-empty string`);
  }
  if (safetyAdvice !== undefined) {
    assert(Array.isArray(safetyAdvice), `${product.slug}: clinical.safetyAdvice must be an array`);
    const topics = new Set();
    for (const advice of Array.isArray(safetyAdvice) ? safetyAdvice : []) {
      assert(validSafetyTopics.has(advice.topic), `${product.slug}: invalid safety topic ${advice.topic}`);
      assert(!topics.has(advice.topic), `${product.slug}: duplicate safety topic ${advice.topic}`);
      topics.add(advice.topic);
      assert(validSafetyStatuses.has(advice.status), `${product.slug}: invalid safety status ${advice.status}`);
      assert(typeof advice.note === "string" && advice.note.length > 0, `${product.slug}: safety advice needs a note`);
    }
  }
  if (quickTips !== undefined) {
    assert(
      Array.isArray(quickTips) && quickTips.every((tip) => typeof tip === "string" && tip.length > 0),
      `${product.slug}: clinical.quickTips must be an array of non-empty strings`,
    );
  }
}

for (const alias of aliases) {
  assert(alias.targetType === "ingredient", `${alias.query}: unsupported target type`);
  assert(ingredientIds.has(alias.targetId), `${alias.query}: unknown target ${alias.targetId}`);
  assert(alias.productEquivalent === false, `${alias.query}: product aliases must not claim equivalence`);
}

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${products.length} products, ${ingredients.length} ingredients, and ${aliases.length} search aliases.`);
