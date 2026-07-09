# Practice Client — DeployShield Delivery Demo

Simulates onboarding a client whose app is live at **https://www.saucedemo.com** (Sauce Demo store).

## Critical flows covered (5 tests)

1. **User login** — valid credentials + locked-out user error
2. **Cart management** — add item, remove item
3. **Product checkout** — full purchase flow end-to-end

## Run locally

```bash
cd practice-client
npm install
npx playwright install chromium
npm test
```

**Node version:** Use Node 18–22 (LTS). Node 23+ may hit a Playwright + TypeScript import issue locally. GitHub Actions uses Node 20 and runs cleanly.

## View report after a run

```bash
npm run test:report
```

## CI/CD

GitHub Actions workflow at `.github/workflows/playwright.yml` runs on every push and PR to `main`.

Push this repo to GitHub to see the green **Passed** build on your pipeline.

## Project structure

```
practice-client/
├── .cursorrules          # DeployShield Playwright standards
├── playwright.config.ts  # Screenshots + video on failure
├── tests/
│   ├── e2e/              # regression.spec.ts (5 tests)
│   ├── pages/            # Page Object Model classes
│   └── fixtures/         # Test users and data
```

## Client onboarding (real projects)

1. Copy `delivery-template/` (or this entire structure) into the client repo root
2. Open repo in Cursor, let it index
3. Update `playwright.config.ts` with the client's staging URL
4. Write page objects + specs for their top 5 flows
5. Wire GitHub Actions or GitLab CI
