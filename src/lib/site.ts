export const siteConfig = {
  name: "Ramnova Healthcare",
  legalName: "Ramnova Healthcare Private Limited",
  tagline: "Changing tomorrow for a better and healthier life.",
  description:
    "Explore Ramnova Healthcare's pharmaceutical formulations, compositions and product information across tablets, capsules, syrups and injections.",
  url: "https://ramnovahealthcare.com",
  email: "ramnovainfo@gmail.com",
  phoneDisplay: "+91 79799 75763",
  phoneHref: "+917979975763",
  whatsappHref:
    "https://wa.me/917979975763?text=Hello%20Ramnova%20Healthcare%2C%20I%20have%20a%20product%20enquiry.",
  address: {
    streetAddress: "FL 104, H-1 Building, Yogi Milan, Ultan Falia",
    addressLocality: "Silvassa",
    addressRegion: "Dadra and Nagar Haveli and Daman and Diu",
    postalCode: "396230",
    addressCountry: "IN",
  },
} as const;

export const primaryNavigation = [
  { href: "/", label: "Home" },
  { href: "/products/", label: "Products" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
] as const;

export const productCategories = [
  { slug: "tablets", singular: "Tablet", label: "Tablets" },
  { slug: "capsules", singular: "Capsule", label: "Capsules" },
  { slug: "syrups", singular: "Syrup", label: "Syrups" },
  { slug: "injections", singular: "Injection", label: "Injections" },
] as const;

export type ProductCategorySlug = (typeof productCategories)[number]["slug"];
