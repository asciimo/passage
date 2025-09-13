# Multi-stage Dockerfile for Passage app
# Supports development (with tests) and production deployment

# Development stage - includes Node.js for testing
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (including dev dependencies for testing and linting)
RUN npm ci

# Copy source code
COPY . .

# Production stage - minimal nginx for serving static files
FROM nginx:alpine AS production

# Copy static files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/
COPY *.css /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check to ensure the app is serving correctly
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Test stage - runs tests and exits (optional use)
FROM development AS test
RUN echo "Running tests..." && \
    npm test && \
    echo "All tests passed!"

# Default target is production
FROM production AS default