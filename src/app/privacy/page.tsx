import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { siteConfig } from "@/lib/site";

const description = "Privacy information for visitors to the Ramnova Healthcare catalogue website.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description,
  alternates: { canonical: "/privacy/" },
  openGraph: {
    type: "website",
    url: "/privacy/",
    title: "Privacy Policy | Ramnova Healthcare",
    description,
  },
};

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy" }]} />
          <h1 className="display-title">Privacy policy.</h1>
          <div className="page-hero-copy">
            <p>A plain-language summary of how this frontend-only catalogue handles information.</p>
          </div>
        </div>
      </section>
      <div className="shell legal-layout">
        <aside className="legal-aside">
          <strong>Last updated</strong>
          24 September 2026
        </aside>
        <article className="legal-content">
          <h2>Information collected by this site</h2>
          <p>
            This website is a static product catalogue. It does not provide accounts, checkout, or
            a contact form, and it does not intentionally store personal information on a Ramnova
            server.
          </p>
          <h2>Direct contact links</h2>
          <p>
            If you choose a phone, email, or WhatsApp link, your communication is handled by your
            chosen service and is subject to that provider&apos;s privacy terms. Only share information
            necessary for your enquiry. Do not send medical records or urgent medical information.
          </p>
          <h2>Hosting and technical logs</h2>
          <p>
            The hosting provider may process standard technical logs such as IP address, browser
            type, requested URL, and timestamps for security and reliable delivery. Ramnova should
            update this policy if analytics, advertising, or additional data processors are added.
          </p>
          <h2>Contact</h2>
          <p>
            Privacy questions may be sent to{" "}
            <a className="text-link" href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </a>
            .
          </p>
        </article>
      </div>
    </>
  );
}
