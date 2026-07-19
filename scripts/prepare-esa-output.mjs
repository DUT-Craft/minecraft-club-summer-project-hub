import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const publicDirectory = fileURLToPath(new URL("../.output/public/", import.meta.url));
const spaFallback = `${publicDirectory}200.html`;
const entryFile = `${publicDirectory}index.html`;

if (!existsSync(spaFallback)) {
  throw new Error(`Nuxt SPA fallback was not generated: ${spaFallback}`);
}

copyFileSync(spaFallback, entryFile);
console.log("Prepared ESA SPA entry from .output/public/200.html");
