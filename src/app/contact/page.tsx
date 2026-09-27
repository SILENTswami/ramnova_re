import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site";

const description =
  "Contact Ramnova Healthcare in Silvassa by phone, email or WhatsApp for product and partnership enquiries.";

export const metadata: Metadata = {
  title: "Contact Ramnova Healthcare",
  description,
  alternates: { canonical: "/contact/" },
  openGraph: {
    type: "website",
    url: "/contact/",
    title: "Contact Ramnova Healthcare",
    description,
  },
};

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Ramnova Healthcare",
    url: `${siteConfig.url}/contact/`,
    mainEntity: { "@id": `${siteConfig.url}/#organization` },
  };

  return (
    <>
      <JsonLd data={contactSchema} />
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <h1 className="display-title">
            Let&apos;s talk <span className="gradient-text">healthcare.</span>
          </h1>
          <div className="page-hero-copy">
            <p>
              For product details, availability and business conversations, reach the Ramnova team
              directly. This site does not collect or store enquiry form data.
            </p>
          </div>
        </div>
      </section>

      <section className="section portfolio-section">
        <div className="shell">
          <div className="contact-grid">
            <article className="contact-card">
              <span className="contact-card-icon">
                <Phone size={20} aria-hidden="true" />
              </span>
              <h2>Call the team</h2>
              <p>Speak directly with Ramnova about product or partnership questions.</p>
              <a className="text-link" href={`tel:${siteConfig.phoneHref}`}>
                {siteConfig.phoneDisplay} <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </article>

            <article className="contact-card">
              <span className="contact-card-icon">
                <Mail size={20} aria-hidden="true" />
              </span>
              <h2>Send an email</h2>
              <p>Share a clear written enquiry and the team can respond by email.</p>
              <a className="text-link" href={`mailto:${siteConfig.email}`}>
                {siteConfig.email} <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </article>

            <article className="contact-card">
              <span className="contact-card-icon">
                <MessageCircle size={20} aria-hidden="true" />
              </span>
              <h2>WhatsApp</h2>
              <p>Start a product enquiry using Ramnova&apos;s published contact number.</p>
              <a className="text-link" href={siteConfig.whatsappHref}>
                Open WhatsApp <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell address-panel">
          <div className="address-copy">
            <p className="eyebrow light">Registered contact address</p>
            <h2>Silvassa, India.</h2>
            <address>
              {siteConfig.address.streetAddress}
              <br />
              {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}
              <br />
              {siteConfig.address.postalCode}, India
            </address>
          </div>
          <div className="address-art" aria-hidden="true">
            <span className="address-pin">
              <MapPin size={34} />
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
