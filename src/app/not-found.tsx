import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <section className="page-hero" style={{ minHeight: "70vh", display: "grid", alignItems: "center" }}>
      <div className="shell page-hero-inner">
        <p className="eyebrow light">404 · Page not found</p>
        <h1 className="display-title">That page is not in the catalogue.</h1>
        <div className="hero-actions">
          <Link className="button button-primary" href="/products/">
            <Search size={17} aria-hidden="true" /> Search products
          </Link>
          <Link className="button button-outline" href="/">
            <ArrowLeft size={17} aria-hidden="true" /> Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
