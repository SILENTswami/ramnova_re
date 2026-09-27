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

assert(products.length === 27, `Expected 27 products, found ${products.length}`);
const validCategories = new Set(["tablets", "capsules", "syrups", "injections"]);
const slugs = new Set();
const ingredientIds = new Set(ingredients.map((ingredient) => ingredient.id));

for (const product of products) {
  assert(typeof product.slug === "string" && /^[a-z0-9-]+$/.test(product.slug), `Invalid slug: ${product.slug}`);
  assert(!slugs.has(product.slug), `Duplicate product slug: ${product.slug}`);
  slugs.add(product.slug);
  assert(validCategories.has(product.category), `${product.slug}: invalid category ${product.category}`);
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
    for (const ingredient of variant.ingredients ?? []) {
      assert(ingredientIds.has(ingredient.ingredientId), `${product.slug}: unknown ingredient ${ingredient.ingredientId}`);
      if (ingredient.strength) {
        assert(typeof ingredient.strength.amount === "number" && ingredient.strength.amount >= 0, `${product.slug}: invalid strength amount`);
        assert(typeof ingredient.strength.unit === "string" && ingredient.strength.unit.length > 0, `${product.slug}: invalid strength unit`);
      }
    }
  }

  for (const field of ["uses", "sideEffects", "warnings", "contraindications", "interactions"]) {
    assert(Array.isArray(product.clinical?.[field]), `${product.slug}: clinical.${field} must be an array`);
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
