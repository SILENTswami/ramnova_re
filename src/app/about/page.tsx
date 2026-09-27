import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { products } from "@/lib/catalog";

const description =
  "Learn about Ramnova Healthcare's product-focused approach, company values and commitment to clear, responsible healthcare communication.";

export const metadata: Metadata = {
  title: "About Ramnova Healthcare",
  description,
  alternates: { canonical: "/about/" },
  openGraph: {
    type: "website",
    url: "/about/",
    title: "About Ramnova Healthcare",
    description,
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
          <h1 className="display-title">
            Care, backed by <span className="gradient-text">clarity.</span>
          </h1>
          <div className="page-hero-copy">
            <p>
              Ramnova Healthcare is a Silvassa-based pharmaceutical company focused on clear
              product information, thoughtful portfolio development and long-term partnerships.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split-section">
          <div className="split-aside">
            <Image
              src="/images/brand/ramnova-logo.webp"
              alt="Ramnova Healthcare brand mark"
              width={305}
              height={305}
            />
            <div className="split-aside-caption">
              <span>Established purpose</span>
              <span>Responsible progress</span>
            </div>
          </div>
          <div className="split-content">
            <p className="eyebrow">Who we are</p>
            <h2>Healthcare communication should be precise, useful and human.</h2>
            <p>
              Ramnova presents a portfolio of pharmaceutical and nutritional formulations. The
              company&apos;s public catalogue currently spans{" "}
              {products.length} products across tablets, capsules, syrups and injections.
            </p>
            <div className="values-list">
              <div className="value-row">
                <span>01</span>
                <div>
                  <strong>Product responsibility</strong>
                  <p>Separate known composition data from information that still needs review.</p>
                </div>
              </div>
              <div className="value-row">
                <span>02</span>
                <div>
                  <strong>Continuous improvement</strong>
                  <p>Make the portfolio easier to understand, navigate and maintain.</p>
                </div>
              </div>
              <div className="value-row">
                <span>03</span>
                <div>
                  <strong>Partner relationships</strong>
                  <p>Keep product and business enquiries direct, accessible and transparent.</p>
                </div>
              </div>
            </div>
            <Link className="button button-dark" href="/products/" style={{ marginTop: 34 }}>
              Explore the portfolio <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section quote-section">
        <div className="shell quote-card">
          <p className="eyebrow">From the founder&apos;s desk</p>
          <blockquote>
            “Our responsibility is to people—through product quality, clearer information and
            thoughtful care.”
          </blockquote>
          <cite>Manjari Kumari · Co-founder</cite>
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <p className="eyebrow light">Work with Ramnova</p>
            <h2>Have a product or business enquiry?</h2>
          </div>
          <Link className="button button-primary" href="/contact/">
            Contact the team <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
