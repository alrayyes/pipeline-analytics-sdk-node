// Builds the reports/ tree published beside the docs site: Cobertura XML and
// an HTML view from bun's lcov output, plus the JUnit XML it already writes.
// Bun has no Cobertura or HTML coverage reporter, so this converts lcov
// itself rather than pulling in genhtml and a Python converter for CI.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

export interface FileCoverage {
  path: string;
  lines: { n: number; hits: number }[];
}

export function parseLcov(text: string): FileCoverage[] {
  const files: FileCoverage[] = [];
  let current: FileCoverage | undefined;
  for (const line of text.split("\n")) {
    if (line.startsWith("SF:")) {
      current = { path: line.slice(3), lines: [] };
      files.push(current);
    } else if (line.startsWith("DA:") && current) {
      const [n, hits] = line.slice(3).split(",");
      current.lines.push({ n: Number(n), hits: Number(hits) });
    }
  }
  return files;
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const rate = (lines: FileCoverage["lines"]) =>
  lines.length === 0
    ? 1
    : lines.filter((l) => l.hits > 0).length / lines.length;

const allLines = (files: FileCoverage[]) => files.flatMap((f) => f.lines);

export function toCobertura(files: FileCoverage[]): string {
  const classes = files
    .map((f) => {
      const lines = f.lines
        .map((l) => `<line number="${l.n}" hits="${l.hits}"/>`)
        .join("");
      const name = escapeXml(f.path);
      return `<class name="${name}" filename="${name}" line-rate="${Number(rate(f.lines).toFixed(4))}" branch-rate="0" complexity="0"><methods/><lines>${lines}</lines></class>`;
    })
    .join("");
  const overall = Number(rate(allLines(files)).toFixed(4));
  return `<?xml version="1.0" encoding="UTF-8"?>
<coverage line-rate="${overall}" branch-rate="0" version="1" timestamp="${Math.floor(Date.now() / 1000)}"><sources><source>.</source></sources><packages><package name="." line-rate="${overall}" branch-rate="0" complexity="0"><classes>${classes}</classes></package></packages></coverage>
`;
}

const percent = (r: number) => `${(r * 100).toFixed(1)}%`;

const page = (title: string, body: string) =>
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body><main><h1>${title}</h1>${body}</main></body></html>
`;

export function coverageHtml(files: FileCoverage[]): string {
  const rows = files
    .map(
      (f) =>
        `<tr><td>${escapeXml(f.path)}</td><td>${percent(rate(f.lines))}</td></tr>`,
    )
    .join("");
  return page(
    "Coverage",
    `<p>Line coverage: ${percent(rate(allLines(files)))}. <a href="coverage.xml">Cobertura XML</a>, <a href="lcov.info">lcov</a>.</p><table><thead><tr><th>File</th><th>Lines</th></tr></thead><tbody>${rows}</tbody></table>`,
  );
}

export interface BuildOptions {
  lcovPath: string;
  junitPaths: string[];
  outDir: string;
}

export function buildReports({ lcovPath, junitPaths, outDir }: BuildOptions) {
  mkdirSync(join(outDir, "coverage"), { recursive: true });
  mkdirSync(join(outDir, "tests"), { recursive: true });

  const files = parseLcov(readFileSync(lcovPath, "utf8"));
  copyFileSync(lcovPath, join(outDir, "coverage", "lcov.info"));
  writeFileSync(join(outDir, "coverage", "coverage.xml"), toCobertura(files));
  writeFileSync(join(outDir, "coverage", "index.html"), coverageHtml(files));

  const links = junitPaths.map((p) => {
    copyFileSync(p, join(outDir, "tests", basename(p)));
    return `<li><a href="${escapeXml(basename(p))}">${escapeXml(basename(p))}</a></li>`;
  });
  writeFileSync(
    join(outDir, "tests", "index.html"),
    page(
      "Tests",
      `<p>JUnit XML from each test runner.</p><ul>${links.join("")}</ul>`,
    ),
  );

  writeFileSync(
    join(outDir, "index.html"),
    page(
      "Reports",
      `<ul><li><a href="tests/">Tests</a></li><li><a href="coverage/">Coverage</a></li></ul>`,
    ),
  );
}

if (import.meta.main) {
  buildReports({
    lcovPath: "coverage/lcov.info",
    junitPaths: ["junit.xml"],
    outDir: process.argv[2] ?? "reports",
  });
}
