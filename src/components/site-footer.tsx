import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { products } from "@/lib/catalog";
import { primaryNavigation, productCategories, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-top">
        <div className="footer-brand">
          <Image
            src="/images/brand/ramnova-logo.webp"
            alt="Ramnova Healthcare"
            width={88}
            height={88}
          />
          <p>
            Clear product information and responsible healthcare communication,
            built around uncompromised care.
          </p>
        </div>

        <div className="footer-column">
          <p className="eyebrow">Navigate</p>
          {primaryNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/medical-disclaimer/">Medical disclaimer</Link>
          <Link href="/privacy/">Privacy</Link>
        </div>

        <div className="footer-column">
          <p className="eyebrow">Portfolio</p>
          {productCategories.map((category) => (
            <Link key={category.slug} href={`/products/${category.slug}/`}>
              {category.label}
            </Link>
          ))}
        </div>

        <address className="footer-contact">
          <p className="eyebrow">Contact</p>
          <a href={`tel:${siteConfig.phoneHref}`}>
            <Phone size={17} aria-hidden="true" />
            {siteConfig.phoneDisplay}
          </a>
          <a href={`mailto:${siteConfig.email}`}>
            <Mail size={17} aria-hidden="true" />
            {siteConfig.email}
          </a>
          <span>
            <MapPin size={17} aria-hidden="true" />
            {siteConfig.address.streetAddress}, {siteConfig.address.addressLocality} – {siteConfig.address.postalCode}
          </span>
          <a className="footer-enquiry" href={siteConfig.whatsappHref}>
            Start an enquiry <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </address>
      </div>
      <div className="shell footer-products">
        <p className="eyebrow">Our products</p>
        <ul className="footer-product-list">
          {products.map((product) => (
            <li key={product.slug}>
              <Link href={`/products/${product.slug}/`}>{product.seoName}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="shell footer-bottom">
        <p>© {new Date().getFullYear()} Ramnova Healthcare Private Limited. GSTIN {siteConfig.gstin} · FSSAI Lic. No. {siteConfig.fssai.licenseNumber}</p>
        <p>Catalogue information only. Not medical advice.</p>
      </div>
    </footer>
  );
}
