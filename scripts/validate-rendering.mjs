import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const appDirectory = join(root, "src/app");
const routeFilePattern = /^(page|layout)\.(?:js|jsx|ts|tsx)$/;
const clientDirectivePattern = /^\s*["']use client["'];?/m;

function collectRouteFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return collectRouteFiles(path);
    if (!routeFilePattern.test(entry.name) || !extname(entry.name)) return [];

    return [path];
  });
}

const routeFiles = collectRouteFiles(appDirectory);
const clientRoutes = routeFiles.filter((path) =>
  clientDirectivePattern.test(readFileSync(path, "utf8")),
);

if (clientRoutes.length) {
  console.error("Route rendering validation failed. Pages and layouts must remain Server Components:");
  for (const path of clientRoutes) console.error(`- ${relative(root, path)}`);
  process.exit(1);
}

console.log(`Validated ${routeFiles.length} server-rendered page and layout files.`);
