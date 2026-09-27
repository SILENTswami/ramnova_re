import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CircleDot,
  FlaskConical,
  Pill,
  Syringe,
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/catalog";
import { productCategories, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ramnova Healthcare | Pharmaceutical Product Catalogue",
  description:
    "Discover Ramnova Healthcare's portfolio of tablets, capsules, syrups and injections with clear product and composition information.",
  alternates: { canonical: "/" },
};

const categoryIcons = {
  tablets: Pill,
  capsules: CircleDot,
  syrups: FlaskConical,
  injections: Syringe,
};

export default function HomePage() {
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: "en-IN",
  };

  return (
    <>
      <JsonLd data={websiteSchema} />
      <section className="home-hero">
        <div className="shell hero-inner">
          <div className="hero-copy">
            <p className="eyebrow light">Pharmaceutical product catalogue · India</p>
            <h1 className="display-title">
              RAMNOVA
              <br />
              <span className="gradient-text">Healthcare</span>
            </h1>
            <p className="hero-lead">
              A clear, responsible view of Ramnova&apos;s pharmaceutical portfolio—built for
              healthcare professionals, distribution partners and informed product discovery.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/products/">
                Explore 27 products <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="button button-outline" href="/about/">
                Our approach
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-cross" />
            <Image
              className="hero-product"
              src="/images/brand/ramnova-logo.webp"
              alt=""
              width={610}
              height={610}
              priority
            />
            <div className="hero-orbit">Uncompromised care</div>
          </div>

          <div className="hero-footnote">
            <span>Silvassa · India</span>
            <span>
              Explore portfolio <ArrowDown size={14} />
            </span>
          </div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Catalogue statistics">
        <div className="shell stats-inner">
          <div className="stats-intro">
            A focused portfolio with clear product information.
          </div>
          <div className="stat">
            <strong>{products.length}</strong>
            <span>Listed products</span>
          </div>
          <div className="stat">
            <strong>{productCategories.length}</strong>
            <span>Dosage forms</span>
          </div>
          <div className="stat">
            <strong>100%</strong>
            <span>Locally hosted imagery</span>
          </div>
        </div>
      </section>

      <section className="section portfolio-section">
        <div className="shell">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Selected portfolio</p>
              <h2 className="section-title">Formulations, made easier to understand.</h2>
            </div>
            <Link className="text-link" href="/products/">
              View every product <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="product-grid">
            {featured.map((product, index) => (
              <ProductCard key={product.slug} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Browse by dosage form</p>
              <h2 className="section-title">Find the right part of the portfolio.</h2>
            </div>
            <p className="section-copy">
              Each category has its own crawlable page, while the catalogue can be searched by
              brand, active ingredient or common terminology.
            </p>
          </div>
          <div className="category-grid">
            {productCategories.map((category, index) => {
              const Icon = categoryIcons[category.slug];
              const count = products.filter((product) => product.category === category.slug).length;
              return (
                <Link
                  className="category-tile"
                  href={`/products/${category.slug}/`}
                  key={category.slug}
                >
                  <span className="category-tile-index">0{index + 1}</span>
                  <h3>{category.label}</h3>
                  <p>{count} products</p>
                  <Icon size={34} strokeWidth={1.5} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section story-section">
        <div className="shell story-layout">
          <div className="story-mark" aria-hidden="true">
            <Image
              src="/images/brand/ramnova-logo.webp"
              alt=""
              width={305}
              height={305}
            />
          </div>
          <div className="story-copy">
            <p className="eyebrow light">What defines us</p>
            <h2 className="section-title">Care begins with clarity.</h2>
            <p>
              Ramnova Healthcare is based in Silvassa and markets pharmaceutical and nutritional
              formulations across multiple dosage forms. This catalogue brings the company&apos;s
              product, composition and packaging information into one clear place.
            </p>
            <div className="principles">
              <div className="principle">
                <span>01</span>
                <strong>Product clarity</strong>
              </div>
              <div className="principle">
                <span>02</span>
                <strong>Composition visibility</strong>
              </div>
              <div className="principle">
                <span>03</span>
                <strong>Responsible claims</strong>
              </div>
            </div>
            <Link className="button button-outline" href="/about/" style={{ marginTop: 36 }}>
              About Ramnova <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <p className="eyebrow light">Product and partnership enquiries</p>
            <h2>Start a conversation with Ramnova.</h2>
          </div>
          <a className="button button-primary" href={siteConfig.whatsappHref}>
            WhatsApp us <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  );
}
