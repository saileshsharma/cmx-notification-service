# FleetInspect Pro - Monitoring Stack

This directory contains the Prometheus + Grafana monitoring setup for FleetInspect Pro.

## Quick Start

```bash
cd monitoring
docker-compose up -d
```

## Access

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `fleetinspect123`

## Components

### Prometheus
Collects metrics from the Spring Boot backend via the `/actuator/prometheus` endpoint.

### Grafana
Provides visualization dashboards for:
- Request rates and response times
- JVM memory usage
- Database connection pool
- Cache hit ratios
- Circuit breaker states
- Rate limiter metrics

## Configuration

### prometheus.yml
Edit `prometheus.yml` to:
- Add production backend URL
- Adjust scrape intervals
- Configure alerting rules

### Grafana Dashboards
Pre-configured dashboards are in `grafana/dashboards/`:
- `fleetinspect-overview.json` - Main overview dashboard

## Backend Requirements

The Spring Boot backend already exposes Prometheus metrics at:
```
GET /actuator/prometheus
```

Enabled metrics include:
- HTTP request metrics
- JVM metrics (memory, GC, threads)
- HikariCP connection pool metrics
- Caffeine cache metrics
- Resilience4j circuit breaker/rate limiter metrics

## Production Deployment

For production, consider:

1. **Secure Grafana**:
   ```yaml
   environment:
     - GF_SECURITY_ADMIN_PASSWORD=<strong-password>
     - GF_AUTH_ANONYMOUS_ENABLED=false
   ```

2. **Add Alerting**:
   Configure alerting rules in `prometheus.yml` and set up Alertmanager.

3. **Persistent Storage**:
   Use named volumes or bind mounts for data persistence.

4. **Reverse Proxy**:
   Put Grafana behind nginx/traefik with HTTPS.

## Useful PromQL Queries

```promql
# Average response time
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])

# Request rate
sum(rate(http_server_requests_seconds_count[5m]))

# Error rate
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / sum(rate(http_server_requests_seconds_count[5m]))

# Active DB connections
hikaricp_connections_active

# JVM heap usage
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}
```
