FROM grafana/grafana:latest

# Environment variables
ENV GF_SECURITY_ADMIN_USER=admin
ENV GF_USERS_ALLOW_SIGN_UP=false
ENV GF_SERVER_HTTP_PORT=3000

# Copy provisioning files
COPY provisioning /etc/grafana/provisioning
COPY dashboards /var/lib/grafana/dashboards

# Expose port
EXPOSE 3000
