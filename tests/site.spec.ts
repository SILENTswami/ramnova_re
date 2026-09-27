import { expect, test } from "@playwright/test";

test("homepage has crawlable brand content and working imagery", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Ramnova Healthcare/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("RAMNOVA");
  await expect(page.getByRole("link", { name: /Explore 27 products/i })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  const brokenImages = await page.locator("img").evaluateAll((images) =>
    images.filter((image) => !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0).length,
  );
  expect(brokenImages).toBe(0);
});

test("Dolo search explains the ingredient relationship", async ({ page }) => {
  await page.goto("/products/");
  const search = page.getByRole("combobox", { name: "Search products" });
  await search.fill("dolo");
  await expect(page.getByText(/Dolo is a brand commonly associated with paracetamol/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /ACEORAM-P/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /ACEORAM-SP/i })).toBeVisible();
  await expect(page.getByText(/2 products/i)).toBeVisible();
});

test("a product deep link exposes metadata, composition and disclaimer", async ({ page }) => {
  await page.goto("/products/aceoram-p/");
  await expect(page.getByRole("heading", { level: 1, name: "ACEORAM-P" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /products\/aceoram-p\/$/);
  await expect(page.getByText(/Important medical information/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Composition and variants" })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);
});

test("single product artwork and composition are server-rendered", async ({ page }) => {
  await page.goto("/products/aceoram-p/");
  const gallery = page.locator(".product-media-carousel");
  await expect(gallery).toHaveAttribute("data-image-count", "1");
  await expect(gallery.getByRole("img", { name: /ACEORAM-P medicine packaging/i })).toBeVisible();
  await expect(gallery.locator(".product-media-controls")).toHaveCount(0);
  const composition = page.locator("#composition");
  await expect(composition.getByText("Aceclofenac", { exact: true })).toBeVisible();
  await expect(composition.getByText("Paracetamol", { exact: true })).toBeVisible();
});

test("category deep links and contact actions work", async ({ page }) => {
  await page.goto("/products/injections/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("injections");
  await expect(page.getByText("2 products in Injections")).toBeVisible();
  await page.goto("/contact/");
  await expect(page.getByRole("link", { name: /Open WhatsApp/i })).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  await expect(page.getByRole("link", { name: /ramnovainfo@gmail.com/i }).first()).toHaveAttribute("href", /^mailto:/);
});

test("mobile navigation opens without overflow", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only assertion");
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
});
