FROM grafana/grafana:latest

# Switch to root to set permissions
USER root

# Environment variables
ENV GF_SECURITY_ADMIN_USER=admin
ENV GF_USERS_ALLOW_SIGN_UP=false
ENV GF_SERVER_HTTP_PORT=3000
ENV GF_PATHS_PROVISIONING=/etc/grafana/provisioning

# Copy provisioning files
COPY --chown=grafana:grafana provisioning /etc/grafana/provisioning
COPY --chown=grafana:grafana dashboards /var/lib/grafana/dashboards

# Ensure grafana user owns the data directory
RUN chown -R grafana:grafana /var/lib/grafana

# Switch back to grafana user
USER grafana

# Expose port
EXPOSE 3000
