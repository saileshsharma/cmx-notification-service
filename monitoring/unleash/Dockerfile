FROM unleashorg/unleash-server:latest

# Unleash runs on port 4242 by default
EXPOSE 4242

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4242/health || exit 1
