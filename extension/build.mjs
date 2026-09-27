import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["src/background.ts"],
  bundle: true,
  outfile: "dist/background.js",
  format: "esm",
  platform: "browser",
  target: "es2022",
});

await build({
  entryPoints: ["src/content/niuke.ts"],
  bundle: true,
  outfile: "dist/content/niuke.js",
  format: "iife",
  platform: "browser",
  target: "es2022",
});

await build({
  entryPoints: ["src/popup.ts"],
  bundle: true,
  outfile: "dist/popup.js",
  format: "esm",
  platform: "browser",
  target: "es2022",
});

cpSync("manifest.json", "dist/manifest.json");
cpSync("src/popup.html", "dist/popup.html");
