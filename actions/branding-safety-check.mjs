import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const bannedPatterns = [
  new RegExp(`${"top"}${"startups"}\\.io`, "gi"),
  new RegExp(`\\b${"top"}${"startups"}\\b`, "gi"),
  new RegExp(`\\b${"startup"}${"blink"}\\b`, "gi"),
  new RegExp(`\\b${"well"}${"found"}\\b`, "gi"),
];

const textFilePattern = /\.(tsx?|jsx?|mjs|cjs|json|md|txt|css|scss|yml|yaml|xml|html)$/i;
const shouldScanBuildOutput = process.env.BRANDING_CHECK_SCAN_BUILD === "1";
const generatedMetadataRoots = shouldScanBuildOutput
  ? [".next/server/app", ".next/server/pages"]
  : [];
const violations = [];
const selfFilePath = "actions/branding-safety-check.mjs";

function scanTextFile(path, content) {
  for (const pattern of bannedPatterns) {
    pattern.lastIndex = 0;
    if (!pattern.test(content)) {
      continue;
    }

    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const start = Math.max(0, match.index - 30);
      const end = Math.min(content.length, match.index + match[0].length + 30);
      const excerpt = content.slice(start, end).replace(/\s+/g, " ");
      violations.push({
        path,
        term: match[0],
        excerpt,
      });
    }
  }
}

function scanTrackedFiles() {
  const output = execSync("git ls-files -z", { encoding: "utf8" });
  const files = output.split("\u0000").filter(Boolean);

  for (const path of files) {
    if (!textFilePattern.test(path)) {
      continue;
    }
    if (path.startsWith("Backup-23feb/")) {
      continue;
    }
    if (path === selfFilePath) {
      continue;
    }

    try {
      const raw = readFileSync(path);
      if (raw.includes(0)) {
        continue;
      }
      scanTextFile(path, raw.toString("utf8"));
    } catch {
      // Skip unreadable files.
    }
  }
}

function walkAndScan(dir) {
  if (!existsSync(dir)) {
    return;
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const info = statSync(fullPath);
    if (info.isDirectory()) {
      walkAndScan(fullPath);
      continue;
    }
    if (!textFilePattern.test(fullPath)) {
      continue;
    }

    try {
      const raw = readFileSync(fullPath);
      if (raw.includes(0)) {
        continue;
      }
      scanTextFile(fullPath, raw.toString("utf8"));
    } catch {
      // Skip unreadable files.
    }
  }
}

scanTrackedFiles();
for (const root of generatedMetadataRoots) {
  walkAndScan(root);
}

if (violations.length > 0) {
  console.error("Branding safety check failed. Banned external references found:\n");
  for (const violation of violations) {
    console.error(`- ${violation.path}`);
    console.error(`  term: ${violation.term}`);
    console.error(`  excerpt: ...${violation.excerpt}...`);
  }
  process.exit(1);
}

console.log("Branding safety check passed.");
