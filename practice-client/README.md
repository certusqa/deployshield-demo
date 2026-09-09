# Practice Client — DeployShield Delivery Demo

Simulates onboarding a client whose staging app is represented by the hermetic **demo SUT** at `fixtures/sut/` (Playwright `webServer` on `http://127.0.0.1:4173`). The CI badge/gate runs against that SUT only.

Live [Sauce Demo](https://www.saucedemo.com) remains available as an optional soft canary (`SKIP_WEBSERVER=1 BASE_URL=https://www.saucedemo.com npm test`, or `.github/workflows/playwright-live.yml`) — not as sales proof.

Repo-root README (brand + CI gate framing): [`../README.md`](../README.md)

## Critical flows covered (6 tests)

1. **User login** — valid credentials + locked-out user error  
2. **Cart management** — add item, remove item  
3. **Product checkout** — full purchase + missing postal code (negative path)

## Run locally

```bash
cd practice-client
npm install
npx playwright install chromium
npm test
```

**Node version:** Use Node 20–22 (LTS; Playwright 1.63 requires Node 20+). GitHub Actions uses Node 20.

## View report after a run

```bash
npm run test:report
```

## CI / pre-deploy gate

GitHub Actions workflow at `.github/workflows/playwright.yml`:

- **Green** → deploy cleared (hermetic demo SUT)  
- **Red** → deploy blocked; Playwright HTML report + `test-results/` uploaded as artifacts  

Live Sauce Demo canary: `.github/workflows/playwright-live.yml` (schedule / manual, no README badge).

## Project structure

```
practice-client/
├── .cursorrules          # DeployShield Playwright standards
├── playwright.config.ts  # webServer → demo SUT; screenshots + video on failure
├── fixtures/sut/         # Hermetic demo SUT (static pages + node:http)
├── tests/
│   ├── e2e/              # Critical-flow specs
│   ├── pages/            # Page Object Model classes
│   └── fixtures/         # Test users and checkout data
```

## MCP authoring + alert payload

Full runbook: [`../docs/DEPLOYSHIELD_MCP_DELIVERY.md`](../docs/DEPLOYSHIELD_MCP_DELIVERY.md)

```bash
# After a run — Slack/Jira-shaped JSON for Instant Alerts (paste manually on base Suite)
npm run alert:payload
# → alert-artifacts/last-alert-payload.json
```

Author flows with Playwright MCP against staging (live DOM). Cap: ≤15 critical flows.

## Client onboarding (real projects)

1. Copy this structure (or `delivery-template/`) into the client repo root  
2. Open repo in Cursor; enable Playwright MCP; explore staging before writing selectors  
3. Update `playwright.config.ts` with the client's **staging** URL (never production)  
4. Write page objects + specs for ≤15 critical flows  
5. Wire GitHub Actions or GitLab CI as a **required** check  
6. On red builds, attach CI artifacts + paste `alert-artifacts/last-alert-payload.json` into Slack/Jira  
