# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the Angular app
RUN npm run build

# Production stage - use nginx to serve
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist/dispatcher-admin/browser /usr/share/nginx/html

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting dispatcher-admin..."' >> /start.sh && \
    echo 'echo "PORT=$PORT"' >> /start.sh && \
    echo 'envsubst '"'"'$PORT'"'"' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /start.sh && \
    echo 'echo "nginx.conf generated:"' >> /start.sh && \
    echo 'cat /etc/nginx/nginx.conf | head -20' >> /start.sh && \
    echo 'echo "Starting nginx..."' >> /start.sh && \
    echo 'exec nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Default port (Railway overrides this with PORT env var)
ENV PORT=80

# Expose the port
EXPOSE 80

# Start nginx via script
CMD ["/start.sh"]
