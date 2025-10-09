FROM ubuntu:22.04

# Install BIND9 and required packages
RUN apt-get update && apt-get install -y \
    bind9 \
    bind9utils \
    bind9-doc \
    dnsutils \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Create BIND directories
RUN mkdir -p /etc/bind/zones
RUN mkdir -p /var/log/bind
RUN chown -R bind:bind /var/log/bind

# Copy BIND configuration
COPY named.conf /etc/bind/named.conf
COPY named.conf.local /etc/bind/named.conf.local
COPY zones/ /etc/bind/zones/

# Copy Python service
COPY . /app
WORKDIR /app

# Create non-root user
RUN useradd -m -u 1000 dns && chown -R dns:dns /app
USER dns

# Health check
COPY healthcheck.py .
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3 healthcheck.py

# Expose DNS ports
EXPOSE 53/udp 53/tcp

# Start BIND and Python service
CMD ["python3", "dns_manager_service.py"]
