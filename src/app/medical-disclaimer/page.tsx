import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";

const description =
  "Important limitations and safety information for the Ramnova Healthcare product catalogue.";

export const metadata: Metadata = {
  title: "Medical Disclaimer",
  description,
  alternates: { canonical: "/medical-disclaimer/" },
  openGraph: {
    type: "website",
    url: "/medical-disclaimer/",
    title: "Medical Disclaimer | Ramnova Healthcare",
    description,
  },
};

export default function MedicalDisclaimerPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Medical disclaimer" }]}
          />
          <h1 className="display-title">
            Information, <span className="gradient-text">not medical advice.</span>
          </h1>
          <div className="page-hero-copy">
            <p>
              The catalogue supports product discovery. It does not replace professional diagnosis,
              prescribing information or the current pack insert.
            </p>
          </div>
        </div>
      </section>
      <div className="shell legal-layout">
        <aside className="legal-aside">
          <strong>Important</strong>
          If you have a medical emergency, contact local emergency services immediately.
        </aside>
        <article className="legal-content">
          <h2>Catalogue purpose</h2>
          <p>
            Product pages summarize information from identified sources for general catalogue and
            business-enquiry purposes. They are not a diagnosis, prescription, treatment plan, or
            recommendation to use a medicine.
          </p>
          <h2>Do not self-medicate or substitute</h2>
          <p>
            Do not start, stop, combine, replace, or change the dose of any medicine based on this
            website. Products that share an ingredient may have different strengths, additional
            ingredients, dosage forms, indications, risks, and legal classifications.
          </p>
          <h2>Information scope</h2>
          <p>
            Product and composition details are presented for catalogue and enquiry purposes.
            Missing safety information must not be interpreted as evidence that no risk exists.
          </p>
          <h2>Professional advice and current labels</h2>
          <p>
            Consult a qualified doctor or pharmacist and the current package insert before using a
            medicine. Prescription products require appropriate professional supervision. Product
            packaging and approved information can change over time.
          </p>
          <h2>Image limitations</h2>
          <p>
            Product artwork is shown for identification. Always rely on the current package and
            approved prescribing information when using a medicine.
          </p>
        </article>
      </div>
    </>
  );
}
