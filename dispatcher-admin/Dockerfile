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

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist/dispatcher-admin/browser /usr/share/nginx/html

# Default port (Railway overrides this with PORT env var)
ENV PORT=80

# Use envsubst to replace ${PORT} in nginx config, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
