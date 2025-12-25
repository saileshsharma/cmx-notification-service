# Load Testing with k6

Performance and load testing suite for the CMX Surveyor Calendar API.

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Test Types

| Type | Description | Duration | Max VUs |
|------|-------------|----------|---------|
| **smoke** | Quick sanity check | ~2.5 min | 5 |
| **load** | Normal load testing | ~16 min | 50 |
| **stress** | Find breaking point | ~26 min | 150 |
| **spike** | Sudden traffic spike | ~6 min | 200 |
| **soak** | Extended duration | ~40 min | 30 |

## Running Tests

### Against Local Backend

```bash
# Start your backend first
cd ../backend && ./mvnw spring-boot:run

# Run smoke test (quick validation)
npm run test:smoke

# Run load test (standard performance test)
npm run test:load

# Run stress test (find limits)
npm run test:stress

# Run spike test (sudden traffic)
npm run test:spike

# Run soak test (memory leaks, long-running)
npm run test:soak
```

### Against Production

```bash
npm run test:prod
```

Or with custom API base:

```bash
k6 run --env API_BASE=https://your-api.com/api tests/api-load.js
```

## Understanding Results

### Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| `http_req_duration p(95)` | < 1000ms | 95% of requests complete in this time |
| `http_req_failed` | < 5% | Percentage of failed requests |
| `errors` | < 5% | Custom error rate from checks |

### Custom Metrics

- `surveyor_list_duration` - Time to fetch surveyor list
- `availability_duration` - Time to fetch availability data
- `create_appointment_duration` - Time to create an appointment
- `activity_log_duration` - Time to fetch activity log

### Sample Output

```
========================================
  K6 Load Test Results - LOAD
========================================

  Total Requests:     12,543
  Failed Requests:    0.12%
  Error Rate:         0.08%

  Response Times:
    p(50):  45.23ms
    p(95):  234.56ms
    p(99):  512.34ms

  Custom Metrics (p95):
    Surveyor List:      123.45ms
    Availability:       234.56ms
    Create Appointment: 345.67ms
    Activity Log:       156.78ms

========================================
```

## Thresholds

Tests will fail if thresholds are exceeded:

### Smoke Test
- 95% of requests < 500ms
- Error rate < 1%

### Load Test
- 95% of requests < 1000ms
- 99% of requests < 2000ms
- Error rate < 5%

### Stress Test
- 95% of requests < 2000ms
- Error rate < 10%

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run k6 Load Tests
  uses: grafana/k6-action@v0.3.1
  with:
    filename: load-tests/tests/api-load.js
  env:
    API_BASE: ${{ secrets.API_BASE_URL }}
    TEST_TYPE: smoke
```

## Troubleshooting

### Connection Refused
Ensure the backend is running and accessible at the configured API_BASE.

### High Error Rate
- Check if the backend has enough resources
- Verify database connections aren't exhausted
- Check for rate limiting

### Slow Response Times
- Monitor backend CPU/memory during test
- Check database query performance
- Look for N+1 query issues
