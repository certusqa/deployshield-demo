# Practice Client — DeployShield Delivery Demo

Simulates onboarding a client whose app is live at **https://www.saucedemo.com** (Sauce Demo store).

Parent repo README (brand + CI gate framing): [`../README.md`](../README.md)

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

**Node version:** Use Node 18–22 (LTS). GitHub Actions uses Node 20.

## View report after a run

```bash
npm run test:report
```

## CI / pre-deploy gate

GitHub Actions workflow at `.github/workflows/playwright.yml`:

- **Green** → deploy cleared  
- **Red** → deploy blocked; Playwright HTML report + `test-results/` uploaded as artifacts  

## Project structure

```
practice-client/
├── .cursorrules          # DeployShield Playwright standards
├── playwright.config.ts  # Screenshots + video on failure
├── tests/
│   ├── e2e/              # regression.spec.ts
│   ├── pages/            # Page Object Model classes
│   └── fixtures/         # Test users and checkout data
```

## MCP authoring + alert payload

Base DeployShield MCP delivery runbook lives in the Certus business OS (`DEPLOYSHIELD_MCP_DELIVERY.md`).

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
