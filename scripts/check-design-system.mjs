#!/usr/bin/env node
/**
 * Design-system conformance checker (no dependencies, runs on plain node).
 *
 * WHY THIS EXISTS
 * The driver app was migrated from ad-hoc View/Text styling onto the src/ui
 * kit. Nothing in eslint knows about that migration, so the rules below encode
 * the parts a reviewer would otherwise have to remember: no raw Text where
 * AppText belongs, no left-aligned text in an RTL app, no dead imports (CI runs
 * eslint with --max-warnings=0, so one dead import fails the build).
 *
 * STRICT vs ADVISORY
 * A path listed in STRICT_PATHS fails the run. Everywhere else the same finding
 * is printed as advice and does not fail, because the migration is not finished
 * and a checker that turns the whole repo red on day one just gets disabled.
 * Widen STRICT_PATHS as directories are migrated - that is the point of it.
 *
 * Usage: npm run design:check
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";

/** Fails the build. Add to this list as more of the app moves onto the kit. */
const STRICT_PATHS = [
  "src/ui/",
  "src/components/FareOpportunityCard.tsx",
  "src/components/ReportRequestSheet.tsx",
  "src/screens/requests/",
  "src/screens/trip/TripCompletedScreen.tsx",
];

/** Pure scrim values: a modal backdrop is not a brand colour. */
const ALLOWED_HEX = new Set(["#000000", "#FFFFFF", "#ffffff"]);

const isStrict = (file) => STRICT_PATHS.some((p) => file.startsWith(p));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full.split("\\").join("/"));
  }
  return out;
}

/**
 * Removes comments while leaving string literals in place.
 *
 * Comments must go before the usage scan: this codebase documents heavily and
 * JSDoc routinely names the very symbol being imported, which would make every
 * dead import look alive. String literals are deliberately kept, because a name
 * that only survives inside a string is a miss, not a false alarm.
 */
function stripComments(src) {
  let out = "";
  let i = 0;
  let mode = "code";
  let quote = "";
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (mode === "code") {
      if (c === "/" && next === "/") {
        mode = "line";
        i += 2;
        continue;
      }
      if (c === "/" && next === "*") {
        mode = "block";
        i += 2;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        mode = "string";
        quote = c;
        out += c;
        i++;
        continue;
      }
      out += c;
      i++;
      continue;
    }
    if (mode === "line") {
      if (c === "\n") {
        mode = "code";
        out += c;
      }
      i++;
      continue;
    }
    if (mode === "block") {
      if (c === "*" && next === "/") {
        mode = "code";
        i += 2;
        continue;
      }
      if (c === "\n") out += c;
      i++;
      continue;
    }
    if (c === "\\") {
      out += c + (next ?? "");
      i += 2;
      continue;
    }
    out += c;
    if (c === quote) mode = "code";
    i++;
  }
  return out;
}

const IMPORT_RE = /import\s+(?:type\s+)?([^;]*?)\s+from\s*["']([^"']+)["'];?/g;

function bindingsOf(clause) {
  const names = [];
  const braced = clause.match(/\{([\s\S]*)\}/);
  if (braced) {
    for (const raw of braced[1].split(",")) {
      const part = raw.replace(/\btype\b/, "").trim();
      if (!part) continue;
      const alias = part.split(/\s+as\s+/).pop().trim();
      if (alias) names.push(alias);
    }
  }
  const head = clause
    .replace(/\{[\s\S]*\}/, "")
    .replace(/,/g, " ")
    .trim();
  const ns = head.match(/\*\s+as\s+([A-Za-z0-9_$]+)/);
  if (ns) names.push(ns[1]);
  else if (head && /^[A-Za-z0-9_$]+$/.test(head)) names.push(head);
  return names;
}

function checkFile(file) {
  const code = stripComments(readFileSync(file, "utf8"));
  const findings = [];

  // ---- dead imports (eslint runs with --max-warnings=0) -------------------
  let body = code;
  const imports = [];
  for (const m of code.matchAll(IMPORT_RE)) {
    imports.push({ clause: m[1], source: m[2] });
    body = body.replace(m[0], "");
  }
  for (const imp of imports) {
    for (const name of bindingsOf(imp.clause)) {
      // React is exempt: the JSX transform may reference it implicitly.
      if (name === "React") continue;
      if (!new RegExp(`\\b${name.replace(/\$/g, "\\$")}\\b`).test(body)) {
        findings.push({
          rule: "dead-import",
          detail: `${name} (from "${imp.source}") is imported and never used`,
        });
      }
    }
  }

  // ---- raw Text where AppText belongs -------------------------------------
  if (/^src\/(screens|components)\//.test(file)) {
    for (const imp of imports) {
      if (imp.source !== "react-native") continue;
      if (bindingsOf(imp.clause).includes("Text")) {
        findings.push({
          rule: "raw-text",
          detail: 'imports Text from "react-native"; use AppText from the ui kit',
        });
      }
    }
  }

  // ---- RTL: no left-aligned text ------------------------------------------
  if (/textAlign:\s*["']left["']/.test(code)) {
    findings.push({
      rule: "rtl-textalign",
      detail: 'textAlign: "left" breaks the RTL layout; use "right" or rtlText',
    });
  }

  // ---- advisory: hardcoded colour -----------------------------------------
  if (!file.startsWith("src/theme")) {
    const hexes = [
      ...new Set(
        (code.match(/#[0-9a-fA-F]{6}\b/g) ?? []).filter(
          (h) => !ALLOWED_HEX.has(h),
        ),
      ),
    ];
    for (const hex of hexes) {
      findings.push({
        rule: "hardcoded-colour",
        advisory: true,
        detail: `${hex} should come from the palette`,
      });
    }
  }

  // ---- advisory: literal row direction ------------------------------------
  if (!file.endsWith("src/ui/rtl.ts") && /flexDirection:\s*["']row["']/.test(code)) {
    findings.push({
      rule: "literal-row",
      advisory: true,
      detail: 'flexDirection: "row" - prefer the rtlRow helper',
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------

const files = walk(ROOT).sort();
let strictCount = 0;
let adviceCount = 0;

for (const file of files) {
  const findings = checkFile(file);
  if (!findings.length) continue;
  const strictFile = isStrict(file);
  const lines = [];
  for (const f of findings) {
    const fatal = strictFile && !f.advisory;
    if (fatal) strictCount++;
    else adviceCount++;
    lines.push(`  ${fatal ? "ERROR  " : "advice "} [${f.rule}] ${f.detail}`);
  }
  console.log(file);
  console.log(lines.join("\n"));
}

console.log(
  `\nchecked ${files.length} files - ${strictCount} error(s), ${adviceCount} advisory`,
);
if (strictCount > 0) {
  console.log("Strict paths must stay clean: " + STRICT_PATHS.join(", "));
  process.exit(1);
}
