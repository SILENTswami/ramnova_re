import { products } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

function toSentenceCase(text: string) {
  const first = text.split(" ")[0];
  return first === first.toUpperCase() ? text : text[0].toLowerCase() + text.slice(1);
}

export function GET() {
  const lines = [
    `# ${siteConfig.legalName}`,
    "",
    `> ${siteConfig.legalName} is a pharmaceutical company based in Silvassa, India.`,
    `> It markets tablets, capsules, syrups, injections and nutritional products.`,
    `> Website: ${siteConfig.url}`,
    "",
    "## Products",
    "",
    ...products.map((product) => {
      const use = product.clinical.uses[0];
      const useText = use ? ` Used for ${toSentenceCase(use)}.` : "";
      return `- [${product.seoName}](${siteConfig.url}/products/${product.slug}/): ${product.displayDescription}.${useText}`;
    }),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
