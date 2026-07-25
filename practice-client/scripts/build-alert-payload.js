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
    const st = fs.statSync(full);
    if (st.isDirectory()) listFailureMedia(full, acc);
    else if (/\.(png|webm|zip)$/i.test(name)) {
      acc.push(path.relative(root, full));
    }
  }
  return acc;
}

function loadJsonReport() {
  const candidates = [
    path.join(resultsDir, 'results.json'),
    path.join(root, 'playwright-report', 'results.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

function summarizeFromReport(report) {
  const suites = report?.suites || [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures = [];

  function walk(suite) {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const result = (t.results || [])[t.results.length - 1];
        const status = result?.status || t.status || 'unknown';
        if (status === 'passed' || status === 'expected') passed += 1;
        else if (status === 'skipped') skipped += 1;
        else {
          failed += 1;
          failures.push({
            title: spec.title || t.title || 'untitled',
            status,
            error: result?.error?.message || null,
          });
        }
      }
    }
    for (const child of suite.suites || []) walk(child);
  }

  for (const s of suites) walk(s);
  return { passed, failed, skipped, failures };
}

const media = listFailureMedia(resultsDir);
const report = loadJsonReport();
const summary = report
  ? summarizeFromReport(report)
  : {
      passed: null,
      failed: media.length ? null : 0,
      skipped: null,
      failures: [],
      note: 'No results.json found — include reporter: [["json", { outputFile: "test-results/results.json" }]] for full counts.',
    };

const gate = summary.failed && summary.failed > 0 ? 'BLOCK_DEPLOY' : media.length ? 'REVIEW_ARTIFACTS' : 'CLEAR_TO_DEPLOY';

const payload = {
  schemaVersion: '1.0.0',
  product: 'DeployShield Suite',
  generatedAt: new Date().toISOString(),
  gateRecommendation: gate,
  summary: {
    passed: summary.passed,
    failed: summary.failed,
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

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${path.relative(root, outPath)}`);
console.log(`gateRecommendation=${gate} media=${media.length}`);
process.exit(0);
