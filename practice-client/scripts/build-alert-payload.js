#!/usr/bin/env node
'use strict';

/**
 * Build Slack- and Jira-shaped alert payloads from the last Playwright HTML report
 * (or a minimal summary when only list output exists).
 *
 * Base DeployShield: paste into Slack/Jira manually.
 * Live API bots = later product phase.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const resultsDir = path.join(root, 'test-results');
const outDir = path.join(root, 'alert-artifacts');
const outPath = path.join(outDir, 'last-alert-payload.json');

function listFailureMedia(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.lstatSync(full);
    if (st.isDirectory()) listFailureMedia(full, acc);
    else if (/\.(png|webm|zip)$/i.test(name)) {
      acc.push(path.relative(root, full));
    }
  }
  return acc;
}

/**
 * Three states — never treat an unreadable file as "no report":
 *   parsed | absent | unparseable
 */
function loadJsonReport() {
  const candidates = [
    path.join(resultsDir, 'results.json'),
    path.join(root, 'playwright-report', 'results.json'),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      return {
        status: 'parsed',
        report: JSON.parse(fs.readFileSync(p, 'utf8')),
        path: path.relative(root, p),
      };
    } catch (err) {
      return {
        status: 'unparseable',
        report: null,
        path: path.relative(root, p),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
  return { status: 'absent', report: null, path: null };
}

const ERROR_MESSAGE_MAX = 240;

/** Strip Playwright received-value blocks and cap length before writing artifacts. */
function sanitizeErrorMessage(message) {
  if (message == null) return null;
  let text = String(message)
    // Drop "Received string|number|..." / "Received:" value blocks (observed page text).
    .replace(/\nReceived(?:\s+(?:string|number|object|value))?:[\s\S]*$/i, '')
    .replace(/\bReceived string:\s*[\s\S]*$/im, '')
    .trim();
  if (text.length > ERROR_MESSAGE_MAX) {
    text = `${text.slice(0, ERROR_MESSAGE_MAX)}…`;
  }
  return text;
}

function summarizeFromReport(report) {
  const suites = report?.suites || [];
  let passed = 0;
  let failed = 0;
  let flaky = 0;
  let skipped = 0;
  const failures = [];

  function walk(suite) {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const results = t.results || [];
        const result = results[results.length - 1];
        const status = result?.status || t.status || 'unknown';
        const isFlaky = t.status === 'flaky' || results.length > 1;
        if (status === 'passed' || status === 'expected') {
          if (isFlaky) flaky += 1;
          else passed += 1;
        } else if (status === 'skipped') skipped += 1;
        else {
          failed += 1;
          failures.push({
            title: spec.title || t.title || 'untitled',
            status,
            error: sanitizeErrorMessage(result?.error?.message || null),
          });
        }
      }
    }
    for (const child of suite.suites || []) walk(child);
  }

  for (const s of suites) walk(s);
  return { passed, failed, flaky, skipped, failures };
}

const media = listFailureMedia(resultsDir);
const loaded = loadJsonReport();

let summary;
let gate;

if (loaded.status === 'parsed') {
  summary = summarizeFromReport(loaded.report);
  gate =
    summary.failed > 0
      ? 'BLOCK_DEPLOY'
      : summary.flaky > 0 || media.length
        ? 'REVIEW_ARTIFACTS'
        : 'CLEAR_TO_DEPLOY';
} else if (loaded.status === 'unparseable') {
  // Corrupt / mid-write report is not a green run — and not a counted failure either.
  summary = {
    passed: null,
    failed: null,
    flaky: null,
    skipped: null,
    failures: [],
    note: `results.json present but unparseable: ${loaded.path}`,
  };
  gate = 'INSUFFICIENT_EVIDENCE';
} else {
  // Absent — do not default failed to 0 (that would CLEAR_TO_DEPLOY).
  summary = {
    passed: null,
    failed: null,
    flaky: null,
    skipped: null,
    failures: [],
    note: 'No results.json found — include reporter: [["json", { outputFile: "test-results/results.json" }]] for full counts.',
  };
  gate = 'INSUFFICIENT_EVIDENCE';
}

const payload = {
  schemaVersion: '1.0.0',
  product: 'DeployShield Suite',
  generatedAt: new Date().toISOString(),
  gateRecommendation: gate,
  reportStatus: loaded.status,
  reportPath: loaded.path,
  summary: {
    passed: summary.passed,
    failed: summary.failed,
    flaky: summary.flaky,
    skipped: summary.skipped,
  },
  failures: summary.failures || [],
  artifacts: {
    mediaPaths: media,
    htmlReportHint: 'playwright-report/ (upload CI artifact)',
  },
  slack: {
    text:
      gate === 'CLEAR_TO_DEPLOY'
        ? 'DeployShield gate: CLEAR_TO_DEPLOY — regression suite green.'
        : gate === 'INSUFFICIENT_EVIDENCE'
          ? `DeployShield gate: INSUFFICIENT_EVIDENCE — results.json ${loaded.status}${loaded.path ? ` (${loaded.path})` : ''}. Do not treat as green.`
          : `DeployShield gate: ${gate} — ${summary.failed ?? '?'} failed test(s). See artifacts (screenshots/video).`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*DeployShield pre-deploy gate:* \`${gate}\``,
        },
      },
    ],
  },
  jira: {
    summary: `DeployShield gate ${gate}`,
    description:
      gate === 'CLEAR_TO_DEPLOY'
        ? 'Regression suite passed. Covered flows clear to deploy.'
        : gate === 'INSUFFICIENT_EVIDENCE'
          ? [
              `Gate: ${gate}`,
              `Report status: ${loaded.status}`,
              loaded.path ? `Unreadable/missing path: ${loaded.path}` : 'No results.json candidate found.',
              summary.note || '',
              '',
              'Do not deploy — the gate lacks a readable Playwright JSON report.',
            ].join('\n')
          : [
              `Gate: ${gate}`,
              '',
              'Failures:',
              ...(summary.failures || []).map((f) => `- ${f.title}: ${f.error || f.status}`),
              '',
              'Attach CI artifacts: playwright-report + test-results (screenshots/video).',
            ].join('\n'),
    labels: ['deployshield', 'pre-deploy-gate'],
  },
};

if (summary.note) payload.summary.note = summary.note;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${path.relative(root, outPath)}`);
console.log(
  `gateRecommendation=${gate} reportStatus=${loaded.status} reportPath=${loaded.path || '-'} media=${media.length}`,
);
process.exit(0);
