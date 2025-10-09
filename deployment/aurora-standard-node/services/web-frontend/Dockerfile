FROM nginx:alpine

# Copy static web assets
COPY html/ /usr/share/nginx/html/

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:80/health || exit 1

EXPOSE 80
