# DeployShield Demo — Playwright Regression + Green CI

Public demo of what [Certus QA](https://certusqa.com) delivers: Playwright end-to-end tests wired into GitHub Actions so critical flows must pass before deploy.

**Target app:** [Sauce Demo](https://www.saucedemo.com) (practice stand-in for a client staging environment)

## What's covered (5 tests)

1. User login — valid credentials
2. User login — locked-out user error
3. Cart — add item
4. Cart — remove item
5. Checkout — full purchase flow

## Run locally

```bash
cd practice-client
npm install
npx playwright install chromium
npm test
```

**Node:** 18–22 (LTS). GitHub Actions uses Node 20.

## CI status

[![DeployShield — Playwright Regression](https://github.com/certusqa/deployshield-demo/actions/workflows/playwright.yml/badge.svg)](https://github.com/certusqa/deployshield-demo/actions/workflows/playwright.yml)

## Learn more

- **Product:** DeployShield Suite — up to 15 Playwright flows, CI/CD integration, Slack/Jira alerts
- **Site:** https://certusqa.com *(landing page coming soon)*
