# Surveyor Calendar - E2E Tests

Playwright-based end-to-end tests for API security and integration testing.

## Features

- **Security Testing** - SQL injection, XSS, input validation
- **Error Handling** - Proper HTTP status codes (4xx vs 5xx)
- **API Integration** - Full endpoint coverage
- **CORS Testing** - Cross-origin request handling

## Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| SQL Injection Prevention | 3 | Rejects SQL injection attempts |
| XSS Prevention | 2 | Sanitizes script injection |
| Input Validation | 4 | Validates request payloads |
| Authentication | 2 | Endpoint access control |
| Rate Limiting | 1 | Handles rapid requests |
| CORS Security | 2 | CORS header verification |
| Error Handling | 4 | Proper error responses |
| HTTP Security Headers | 1 | Security headers present |
| Data Exposure | 2 | No sensitive data leaks |
| File Upload Security | 1 | Rejects unexpected uploads |
| Session Security | 1 | Cookie security flags |

**Total: 23 tests**

## Prerequisites

- Node.js 18+
- Backend running on port 8080

## Installation

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run all security tests
npx playwright test tests/security.spec.ts

# Run with list reporter
npx playwright test tests/security.spec.ts --reporter=list

# Run specific test
npx playwright test -g "SQL Injection"

# Debug mode
npx playwright test --debug
```

## Configuration

Edit `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8080',
  },
});
```

## Test Structure

```
e2e-tests/
├── tests/
│   └── security.spec.ts    # Security test suite
├── playwright.config.ts     # Playwright configuration
├── package.json
└── README.md
```

## Sample Output

```
Running 23 tests using 1 worker

  ✓ SQL Injection Prevention › GET /surveyors - rejects SQL injection
  ✓ XSS Prevention › POST /mobile/availability - sanitizes XSS in title
  ✓ Error Handling › Invalid endpoint returns 404, not 500
  ...

  23 passed (909ms)
```

## Adding New Tests

```typescript
test.describe('New Security Test', () => {
  test('should validate input', async ({ request }) => {
    const response = await request.post('/api/endpoint', {
      data: { malicious: '<script>alert(1)</script>' }
    });
    expect(response.status()).toBe(400);
  });
});
```

## License

Proprietary - All rights reserved.
