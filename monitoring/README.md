# FleetInspect Pro - Monitoring Stack

Prometheus + Grafana monitoring setup for FleetInspect Pro backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAILWAY                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Prometheus  │────►│   Grafana    │     │   Backend    │    │
│  │   :9090      │     │    :3000     │     │   :8080      │    │
│  └──────┬───────┘     └──────────────┘     └──────┬───────┘    │
│         │                                          │            │
│         │         Scrapes /actuator/prometheus     │            │
│         └──────────────────────────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start (Local)

```bash
cd monitoring
docker-compose up -d
```

**Access:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
  - Username: `admin`
  - Password: `fleetinspect123`

---

## Deploy to Railway

### Option 1: Via Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to your project
railway link

# Deploy Prometheus
cd monitoring/prometheus
railway up --service prometheus

# Deploy Grafana
cd ../grafana
railway up --service grafana
```

### Option 2: Via Railway Dashboard

1. **Deploy Prometheus:**
   - Go to your Railway project
   - Click "New" → "Empty Service"
   - Name it `prometheus`
   - Go to Settings → General → Root Directory: `monitoring/prometheus`
   - Deploy

2. **Deploy Grafana:**
   - Click "New" → "Empty Service"
   - Name it `grafana`
   - Go to Settings → General → Root Directory: `monitoring/grafana`
   - Add environment variables (see below)
   - Deploy

### Environment Variables

#### Grafana Service
| Variable | Value |
|----------|-------|
| `GF_SECURITY_ADMIN_PASSWORD` | `<your-secure-password>` |
| `GF_SERVER_ROOT_URL` | `https://grafana-production.up.railway.app` |
| `PROMETHEUS_URL` | `http://prometheus.railway.internal:9090` |

#### Prometheus Service
No additional environment variables needed - it will auto-connect to your backend.

### Network Configuration

Railway uses private networking for service-to-service communication:
- Prometheus connects to backend at: `https://cmx-notification-be-production.up.railway.app/actuator/prometheus`
- Grafana connects to Prometheus at: `http://prometheus.railway.internal:9090`

### Generate Public URLs

For each service, go to Settings → Networking → Generate Domain:
- Prometheus: `https://prometheus-production.up.railway.app`
- Grafana: `https://grafana-production.up.railway.app`

---

## Project Structure

```
monitoring/
├── docker-compose.yml          # Local development
├── prometheus.yml              # Local Prometheus config
├── README.md                   # This file
│
├── prometheus/                 # Railway Prometheus service
│   ├── Dockerfile
│   ├── prometheus.yml          # Production config
│   └── railway.toml
│
└── grafana/                    # Railway Grafana service
    ├── Dockerfile
    ├── railway.toml
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yml
    │   └── dashboards/
    │       └── dashboards.yml
    └── dashboards/
        └── fleetinspect-overview.json
```

## Metrics Available

The Spring Boot backend exposes these metrics at `/actuator/prometheus`:

| Category | Metrics |
|----------|---------|
| HTTP | Request count, latency, error rate |
| JVM | Heap/non-heap memory, GC, threads |
| Database | HikariCP connection pool stats |
| Cache | Caffeine hit/miss ratios |
| Resilience4j | Circuit breaker state, rate limiter |

## Pre-built Dashboards

### FleetInspect Overview (`fleetinspect-overview.json`)
- Request rate & latency
- Error rate
- JVM memory usage
- Database connections
- Top endpoints by traffic

## Useful PromQL Queries

```promql
# Average response time (5m window)
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])

# Request rate per second
sum(rate(http_server_requests_seconds_count[5m]))

# Error rate (5xx responses)
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
  / sum(rate(http_server_requests_seconds_count[5m])) * 100

# Active database connections
hikaricp_connections_active

# JVM heap usage percentage
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100

# Circuit breaker state (0=closed, 1=open, 2=half-open)
resilience4j_circuitbreaker_state
```

## Alerting (Optional)

Add alert rules to Prometheus:

```yaml
# prometheus/alert-rules.yml
groups:
  - name: fleetinspect
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / sum(rate(http_server_requests_seconds_count[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected (>5%)"

      - alert: HighMemoryUsage
        expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "JVM heap usage above 85%"
```

## Troubleshooting

### Prometheus can't scrape backend
1. Verify backend is running and healthy
2. Check `/actuator/prometheus` endpoint is accessible
3. Verify HTTPS/HTTP scheme in prometheus.yml

### Grafana can't connect to Prometheus
1. Check `PROMETHEUS_URL` environment variable
2. Verify Prometheus service is running
3. Check Railway private networking is enabled

### No data in dashboards
1. Check Prometheus targets: http://prometheus:9090/targets
2. Verify scrape interval (default 30s for production)
3. Check time range in Grafana (default: last 5 minutes)

## Cost Estimate (Railway)

| Service | Memory | Approx. Monthly Cost |
|---------|--------|---------------------|
| Prometheus | 512MB | ~$5 |
| Grafana | 256MB | ~$3 |
| **Total** | | **~$8/month** |

---

## License

Proprietary - All rights reserved.
