# CSW Connect QA Automation

Playwright + TypeScript test framework for the CSW Connect customer portal.
It uses the Page Object Model, data-driven tests, and a single configuration
source so there are no hard-coded values scattered across the code.

## Project structure

```
qa-automation/
├── tests/                 Test specs
│   ├── login.spec.ts      Login page and login flow (TC-001..TC-006)
│   └── reports.spec.ts    Ad Reports filters and export downloads
├── pages/                 Page Objects
│   ├── BasePage.ts        Shared navigation/wait/assertion helpers
│   ├── LoginPage.ts       Login page model
│   └── ReportsPage.ts     Ad Reports page model
├── utils/                 Helpers and configuration
│   ├── AppConfig.ts       Single source of truth for config/constants
│   ├── dataReader.ts      Reads users/filters from JSON or Excel
│   ├── TestDataHelper.ts  Loads and exposes test data
│   ├── downloadHelper.ts  Download + file existence helpers
│   ├── dateHelper.ts      Date-range input helper
│   └── fileVerifier.ts    Excel/PDF content verification
├── data/                  Test data (real values are gitignored)
│   ├── users.json         Credentials (placeholders committed)
│   └── reportFilters.json Report filter sets
├── .env                   Local environment config (gitignored)
└── playwright.config.ts   Playwright runner config (reads AppConfig)
```

## Setup

```bash
npm install
npx playwright install chromium firefox
```

## Configuration

All configuration lives in `.env` (copy from `.env.example`) and is exposed
through `utils/AppConfig.ts`. No URLs, endpoints, timeouts, or data-source
choices are hard-coded in the tests.

| Variable      | Purpose                                  | Default                        |
|---------------|------------------------------------------|--------------------------------|
| `BASE_URL`    | Application under test                   | `https://qacsconnect.cswg.com` |
| `DATA_SOURCE` | Test data source: `json` or `excel`      | `json`                         |
| `HEADLESS`    | Run browsers headless (`true` in CI)     | `false`                        |
| `CI`          | Enables CI behavior (retries, etc.)      | `false`                        |

## Test data and credentials

Credentials are never hard-coded in code and are never logged. Provide them in
the gitignored data file:

- JSON: `data/users.json` (see `data/users.example.json` for the shape)
- Excel: `data/users.xlsx` with columns `username, password, role, description, active`

Switch sources by setting `DATA_SOURCE` in `.env` (no code changes needed).

## Running tests

```bash
npm test                 # all tests, current config
npm run test:headed      # all tests with a visible browser
npm run test:login       # login spec only (headed)
npm run test:debug       # Playwright Inspector
npm run test:report      # open the last HTML report
```

Run a subset by name:

```bash
npx playwright test --grep "TC-004"
```

## Running with Docker

The tests can run in a container using the official Playwright image (browsers
and OS dependencies are preinstalled — no local Node/Playwright setup needed).

Credentials are **not** baked into the image (see `.dockerignore`). You provide
`data/users.json` locally and it is mounted at runtime. Create it first from the
example:

```bash
cp data/users.example.json data/users.json   # then edit with real credentials
```

### Using docker compose (recommended)

```bash
# Build the image and run the full suite
docker compose run --rm playwright-tests

# Override the target environment
BASE_URL=https://qacsconnect.cswg.com docker compose run --rm playwright-tests
```

The HTML report and failure artifacts are written back to the host at
`playwright-report/` and `test-results/` via mounted volumes. View the report:

```bash
npx playwright show-report
```

### Using plain docker

```bash
docker build -t cswg-qa-automation .

docker run --rm \
  -e BASE_URL=https://qacsconnect.cswg.com \
  -v "$(pwd)/data/users.json:/app/data/users.json:ro" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  cswg-qa-automation
```

> Note: if the application under test is on an internal network/VPN, the
> container must be able to reach it (run Docker on a machine inside that
> network, or expose the host network with `--network host` on Linux).

## Test coverage

| ID     | Area              | Verifies                                          |
|--------|-------------------|---------------------------------------------------|
| TC-001 | Login page        | Required fields render and login button enabled   |
| TC-002 | Login page        | Password input is masked                          |
| TC-003 | Login page        | Validation when submitting empty fields           |
| TC-004 | Login flow        | Admin user logs in successfully                   |
| TC-005 | Login flow        | Every user in the data source can log in          |
| TC-006 | Login flow        | Lookup user by role and log in                    |
| Reports| Ad Reports        | Apply filters, search, and export PDF/Excel       |

## Conventions

- Keep selectors and UI actions in `pages/*`; keep test logic in `tests/*`.
- Reference shared values from `AppConfig`; do not hard-code URLs or timeouts.
- Never log credentials.
```
