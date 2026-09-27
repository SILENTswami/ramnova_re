import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  display: "optional",
  weight: "200 800",
});

const spaceGrotesk = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-space-grotesk",
  display: "optional",
  weight: "300 700",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Ramnova Healthcare | Pharmaceutical Product Catalogue",
    template: "%s | Ramnova Healthcare",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.legalName }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    title: "Ramnova Healthcare",
    description: siteConfig.description,
    url: siteConfig.url,
    images: [
      {
        url: "/images/brand/ramnova-logo.webp",
        width: 305,
        height: 305,
        alt: "Ramnova Healthcare",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Ramnova Healthcare",
    description: siteConfig.description,
    images: ["/images/brand/ramnova-logo.webp"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/brand/ramnova-logo.webp`,
    email: siteConfig.email,
    telephone: siteConfig.phoneHref,
    address: {
      "@type": "PostalAddress",
      ...siteConfig.address,
    },
  };

  return (
    <html lang="en-IN" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>
        <JsonLd data={organization} />
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
