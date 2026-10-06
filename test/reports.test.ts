import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildReports,
  coverageHtml,
  parseLcov,
  toCobertura,
} from "../hack/reports.js";

const LCOV = `TN:
SF:src/a.ts
DA:1,3
DA:2,0
LF:2
LH:1
end_of_record
SF:src/b<&>.ts
DA:1,1
LF:1
LH:1
end_of_record
`;

describe("parseLcov", () => {
  test("reads each file's line hits", () => {
    expect(parseLcov(LCOV)).toEqual([
      {
        path: "src/a.ts",
        lines: [
          { n: 1, hits: 3 },
          { n: 2, hits: 0 },
        ],
      },
      { path: "src/b<&>.ts", lines: [{ n: 1, hits: 1 }] },
    ]);
  });
});

describe("toCobertura", () => {
  const xml = toCobertura(parseLcov(LCOV));

  test("is a Cobertura document with the overall line rate", () => {
    expect(xml).toContain("<coverage ");
    expect(xml).toContain('line-rate="0.6667"');
    expect(xml).toContain('<line number="2" hits="0"/>');
  });

  test("escapes XML in file names", () => {
    expect(xml).toContain('filename="src/b&lt;&amp;&gt;.ts"');
  });

  test("reports an empty run as fully covered rather than dividing by zero", () => {
    expect(toCobertura([])).toContain('line-rate="1"');
  });

  test("reports a file with no lines as fully covered", () => {
    expect(toCobertura([{ path: "x.ts", lines: [] }])).toContain(
      'class name="x.ts" filename="x.ts" line-rate="1"',
    );
  });
});

describe("coverageHtml", () => {
  test("lists each file with its percentage", () => {
    const html = coverageHtml(parseLcov(LCOV));
    expect(html).toContain("<td>src/a.ts</td><td>50.0%</td>");
    expect(html).toContain("src/b&lt;&amp;&gt;.ts");
    expect(html).toContain("66.7%");
  });

  test("shows 100% for an empty run", () => {
    expect(coverageHtml([])).toContain("100.0%");
  });
});

describe("buildReports", () => {
  test("lays out the published reports tree", () => {
    const dir = mkdtempSync(join(tmpdir(), "reports-"));
    buildReports({
      lcovPath: "coverage/lcov.info",
      junitPaths: ["junit.xml"],
      outDir: dir,
    });
    const read = (p: string) => readFileSync(join(dir, p), "utf8");
    expect(read("coverage/coverage.xml")).toContain("<coverage ");
    expect(read("coverage/lcov.info")).toContain("SF:src/");
    expect(read("coverage/index.html")).toContain("<table>");
    expect(read("tests/junit.xml")).toContain("<testsuites");
    expect(read("tests/index.html")).toContain('href="junit.xml"');
    expect(read("index.html")).toContain('href="coverage/"');
    expect(read("index.html")).toContain('href="tests/"');
  });
});
