import { describe, expect, it } from "vitest";
import vercelConfig from "../../vercel.json";

describe("legacy redirects", () => {
  // With trailingSlash enabled, Vercel adds the slash before matching redirects, so every
  // source must be listed with and without it or the slash form ends in a 404.
  it("cover both the slash and no-slash form of every source", () => {
    const sources = new Set(vercelConfig.redirects.map((redirect) => redirect.source));
    for (const source of sources) {
      const counterpart = source.endsWith("/") ? source.slice(0, -1) : `${source}/`;
      expect(sources, `missing ${counterpart}`).toContain(counterpart);
    }
  });

  it("send both forms to the same permanent destination", () => {
    const bySource = new Map(vercelConfig.redirects.map((redirect) => [redirect.source, redirect]));
    for (const redirect of vercelConfig.redirects) {
      expect(redirect.permanent).toBe(true);
      const counterpart = redirect.source.endsWith("/")
        ? redirect.source.slice(0, -1)
        : `${redirect.source}/`;
      expect(bySource.get(counterpart)?.destination).toBe(redirect.destination);
    }
  });
});
