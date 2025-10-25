# Chorus Network Deployment Guide

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** Production Deployment Guide

---

## Overview

This guide provides comprehensive instructions for deploying the Chorus Network in production environments. It covers single-instance deployments, multi-instance federations, and Kubernetes cluster deployments.

## 🏗️ **Deployment Architectures**

### **Single-Instance Deployment**
Ideal for development, testing, and small private communities.

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │
┌──────▼──────┐
│    Stage    │◄─┐
└──────┬──────┘  │
       │         │
┌──────▼──────┐  │
│   Bridge    │──┘
└──────┬──────┘
       │
┌──────▼──────┐
│  Conductor  │
└─────────────┘
```

### **Multi-Instance Federation**
Production networks with multiple operators.

```
┌───────────┐        ┌───────────┐        ┌───────────┐
│ Clients A │        │ Clients B │        │ Clients C │
└─────┬─────┘        └─────┬─────┘        └─────┬─────┘
      │                    │                    │
┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
│  Stage A  │        │  Stage B  │        │  Stage C  │
└─────┬─────┘        └─────┬─────┘        └─────┬─────┘
      │                    │                    │
┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
│  Bridge A │◄──────►│  Bridge B │◄──────►│  Bridge C │
└─────┬─────┘   P2P  └─────┬─────┘   P2P  └─────┬─────┘
      │                    │                    │
      └────────────────────┼────────────────────┘
                           │
                   ┌───────▼────────┐
                   │   Conductor    │
                   │  (BFT Cluster) │
                   └────────────────┘
```

## 🐳 **Docker Deployment**

### **Single-Instance with Docker Compose**

#### **1. Create docker-compose.yml**
```yaml
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chorus
      POSTGRES_USER: chorus
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U chorus"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Chorus Stage
  stage:
    image: chorus/stage:latest
    environment:
      DATABASE_URL: postgresql://chorus:${POSTGRES_PASSWORD}@postgres:5432/chorus
      BRIDGE_BASE_URL: http://bridge:8001
      BRIDGE_INSTANCE_ID: stage-1
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
    ports:
      - "8000:8000"
      - "9090:9090"
    depends_on:
      postgres:
        condition: service_healthy
      bridge:
        condition: service_started
    volumes:
      - ./keys:/app/keys
      - ./config:/app/config

  # Chorus Bridge
  bridge:
    image: chorus/bridge:latest
    environment:
      BRIDGE_INSTANCE_ID: bridge-1
      CONDUCTOR_ENDPOINT: http://conductor:8002
      DATABASE_URL: rocksdb://./bridge_data
      NETWORK_LISTEN_ADDRESS: 0.0.0.0:4001
    ports:
      - "8001:8001"
      - "4001:4001"
      - "9091:9091"
    depends_on:
      conductor:
        condition: service_started
    volumes:
      - bridge_data:/app/bridge_data
      - ./keys:/app/keys

  # Chorus Conductor
  conductor:
    image: chorus/conductor:latest
    environment:
      CONDUCTOR_ID: conductor-1
      VDF_DIFFICULTY: 86400000
      CONSENSUS_THRESHOLD: 0.67
      NETWORK_LISTEN_ADDRESS: 0.0.0.0:4002
    ports:
      - "8002:8002"
      - "4002:4002"
      - "9092:9092"
    volumes:
      - conductor_data:/app/conductor_data
      - ./keys:/app/keys

  # Redis (for caching)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  bridge_data:
  conductor_data:
  redis_data:
```

#### **2. Create .env file**
```env
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET_KEY=your-jwt-secret-key
```

#### **3. Deploy**
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### **Multi-Instance Federation**

#### **Stage Instance (stage-1)**
```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chorus
      POSTGRES_USER: chorus
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  stage:
    image: chorus/stage:latest
    environment:
      DATABASE_URL: postgresql://chorus:${POSTGRES_PASSWORD}@postgres:5432/chorus
      BRIDGE_BASE_URL: http://bridge-1.chorus.social:8001
      BRIDGE_INSTANCE_ID: stage-1
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  bridge:
    image: chorus/bridge:latest
    environment:
      BRIDGE_INSTANCE_ID: bridge-1.chorus.social
      CONDUCTOR_ENDPOINT: http://conductor.chorus.social:8002
      NETWORK_LISTEN_ADDRESS: 0.0.0.0:4001
    ports:
      - "8001:8001"
      - "4001:4001"
```

## ☸️ **Kubernetes Deployment**

### **Namespace Setup**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: chorus
  labels:
    name: chorus
```

### **Stage Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chorus-stage
  namespace: chorus
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chorus-stage
  template:
    metadata:
      labels:
        app: chorus-stage
    spec:
      containers:
      - name: stage
        image: chorus/stage:latest
        ports:
        - containerPort: 8000
        - containerPort: 9090
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: chorus-secrets
              key: database-url
        - name: BRIDGE_BASE_URL
          value: "http://chorus-bridge:8001"
        - name: BRIDGE_INSTANCE_ID
          value: "stage-1"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: chorus-stage
  namespace: chorus
spec:
  selector:
    app: chorus-stage
  ports:
  - name: http
    port: 8000
    targetPort: 8000
  - name: metrics
    port: 9090
    targetPort: 9090
  type: ClusterIP
```

### **Bridge Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chorus-bridge
  namespace: chorus
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chorus-bridge
  template:
    metadata:
      labels:
        app: chorus-bridge
    spec:
      containers:
      - name: bridge
        image: chorus/bridge:latest
        ports:
        - containerPort: 8001
        - containerPort: 4001
        - containerPort: 9091
        env:
        - name: BRIDGE_INSTANCE_ID
          value: "bridge-1.chorus.social"
        - name: CONDUCTOR_ENDPOINT
          value: "http://chorus-conductor:8002"
        - name: DATABASE_URL
          value: "rocksdb://./bridge_data"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: bridge-data
          mountPath: /app/bridge_data
      volumes:
      - name: bridge-data
        persistentVolumeClaim:
          claimName: bridge-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: chorus-bridge
  namespace: chorus
spec:
  selector:
    app: chorus-bridge
  ports:
  - name: http
    port: 8001
    targetPort: 8001
  - name: p2p
    port: 4001
    targetPort: 4001
  - name: metrics
    port: 9091
    targetPort: 9091
  type: ClusterIP
```

### **Conductor Deployment**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: chorus-conductor
  namespace: chorus
spec:
  serviceName: chorus-conductor
  replicas: 3
  selector:
    matchLabels:
      app: chorus-conductor
  template:
    metadata:
      labels:
        app: chorus-conductor
    spec:
      containers:
      - name: conductor
        image: chorus/conductor:latest
        ports:
        - containerPort: 8002
        - containerPort: 4002
        - containerPort: 9092
        env:
        - name: CONDUCTOR_ID
          value: "conductor-1"
        - name: VDF_DIFFICULTY
          value: "86400000"
        - name: CONSENSUS_THRESHOLD
          value: "0.67"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: conductor-data
          mountPath: /app/conductor_data
        - name: keys
          mountPath: /app/keys
      volumes:
      - name: conductor-data
        persistentVolumeClaim:
          claimName: conductor-data-pvc
      - name: keys
        secret:
          secretName: chorus-keys
---
apiVersion: v1
kind: Service
metadata:
  name: chorus-conductor
  namespace: chorus
spec:
  selector:
    app: chorus-conductor
  ports:
  - name: http
    port: 8002
    targetPort: 8002
  - name: p2p
    port: 4002
    targetPort: 4002
  - name: metrics
    port: 9092
    targetPort: 9092
  type: ClusterIP
```

### **Persistent Volume Claims**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: bridge-data-pvc
  namespace: chorus
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: conductor-data-pvc
  namespace: chorus
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

### **Secrets**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: chorus-secrets
  namespace: chorus
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL2Nob3J1czpwYXNzd29yZEBwb3N0Z3Jlczo1NDMyL2Nob3J1cw==
---
apiVersion: v1
kind: Secret
metadata:
  name: chorus-keys
  namespace: chorus
type: Opaque
data:
  stage-key: <base64-encoded-key>
  bridge-key: <base64-encoded-key>
  conductor-key: <base64-encoded-key>
```

## 🔧 **Configuration**

### **Stage Configuration**
```yaml
# stage.yaml
stage:
  instance_id: stage-1
  domain: stage.chorus.social
  
  database:
    url: postgresql://chorus:password@localhost:5432/chorus
    pool_size: 20
    max_overflow: 30

  bridge:
    enabled: true
    base_url: http://bridge.chorus.social:8001
    instance_id: stage-1
    mtls_enabled: true
    jwks_url: http://bridge.chorus.social:8001/.well-known/jwks.json
    jwt_issuer: stage-1
    jwt_audience: chorus-bridge
    token_ttl_seconds: 300

  security:
    jwt_secret_key: your-secret-key
    rate_limits:
      posts_create_per_day:
        tier_new: 5
        tier_veteran: 50
      votes_cast_per_day:
        tier_new: 20
        tier_veteran: 100

  monitoring:
    prometheus_port: 9090
    log_level: INFO
```

### **Bridge Configuration**
```yaml
# bridge.yaml
bridge:
  instance_id: bridge-1.chorus.social
  private_key_path: /keys/bridge.key
  domain: bridge-1.chorus.social

  network:
    listen_address: 0.0.0.0:4001
    bootstrap_peers:
      - /ip4/1.2.3.4/tcp/4001/p2p/QmABC
    gossipsub_topics:
      - /chorus/events/{day}
      - /chorus/proofs
      - /chorus/blacklist

  conductor:
    endpoint: http://conductor.chorus.social:8002
    timeout_seconds: 30

  storage:
    backend: rocksdb
    path: ./bridge_data

  security:
    replay_cache_ttl_seconds: 86400
    rate_limit_per_peer_rps: 10

  monitoring:
    prometheus_port: 9091
    log_level: INFO
```

### **Conductor Configuration**
```yaml
# conductor.yaml
conductor:
  instance_id: conductor-1
  keypair_path: /keys/conductor.key

  vdf:
    difficulty: 86400000
    reference_hardware: aws-c5-large
    adjustment_interval_days: 10

  network:
    listen_address: 0.0.0.0:4002
    bootstrap_peers:
      - /ip4/1.2.3.4/tcp/4002/p2p/QmDEF

  consensus:
    min_nodes: 3
    threshold: 0.67
    timeout_seconds: 120

  storage:
    backend: rocksdb
    path: ./conductor_data

  monitoring:
    prometheus_port: 9092
    log_level: INFO
```

## 🔐 **Security Configuration**

### **TLS Certificates**
```bash
# Generate self-signed certificates for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# For production, use Let's Encrypt or commercial certificates
certbot certonly --standalone -d stage.chorus.social
```

### **Firewall Rules**
```bash
# Allow HTTP/HTTPS traffic
ufw allow 80/tcp
ufw allow 443/tcp

# Allow P2P traffic
ufw allow 4001/tcp
ufw allow 4002/tcp

# Allow metrics
ufw allow 9090:9092/tcp
```

### **Database Security**
```sql
-- Create dedicated users
CREATE USER chorus_app WITH PASSWORD 'secure-password';
CREATE USER chorus_readonly WITH PASSWORD 'readonly-password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE chorus TO chorus_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO chorus_readonly;
```

## 📊 **Monitoring Setup**

### **Prometheus Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'chorus-stage'
    static_configs:
      - targets: ['stage.chorus.social:9090']
  
  - job_name: 'chorus-bridge'
    static_configs:
      - targets: ['bridge.chorus.social:9091']
  
  - job_name: 'chorus-conductor'
    static_configs:
      - targets: ['conductor.chorus.social:9092']
```

### **Grafana Dashboards**
```bash
# Start Grafana
docker run -d --name grafana \
  -p 3000:3000 \
  grafana/grafana

# Import dashboards
# Copy dashboard JSON files to Grafana
```

## 🚀 **Deployment Scripts**

### **Deploy Script**
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting Chorus Network deployment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Create directories
mkdir -p keys config data

# Generate keys if they don't exist
if [ ! -f keys/stage.key ]; then
    echo "Generating keys..."
    # Generate Ed25519 keys for each component
fi

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Check health
echo "Checking service health..."
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:8001/health || exit 1
curl -f http://localhost:8002/health || exit 1

echo "Deployment completed successfully!"
```

### **Health Check Script**
```bash
#!/bin/bash
# health-check.sh

check_service() {
    local name=$1
    local url=$2
    
    if curl -f -s "$url" > /dev/null; then
        echo "✅ $name is healthy"
        return 0
    else
        echo "❌ $name is unhealthy"
        return 1
    fi
}

echo "Checking Chorus Network health..."

check_service "Stage" "http://localhost:8000/health"
check_service "Bridge" "http://localhost:8001/health"
check_service "Conductor" "http://localhost:8002/health"

echo "Health check completed!"
```

## 🔄 **Backup & Recovery**

### **Database Backup**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/chorus"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker exec chorus_postgres pg_dump -U chorus chorus > "$BACKUP_DIR/postgres_$DATE.sql"

# Backup Bridge data
docker exec chorus_bridge tar -czf - /app/bridge_data > "$BACKUP_DIR/bridge_$DATE.tar.gz"

# Backup Conductor data
docker exec chorus_conductor tar -czf - /app/conductor_data > "$BACKUP_DIR/conductor_$DATE.tar.gz"

echo "Backup completed: $BACKUP_DIR"
```

### **Recovery Script**
```bash
#!/bin/bash
# restore.sh

BACKUP_DIR="/backups/chorus"
BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    exit 1
fi

echo "Restoring from backup: $BACKUP_DATE"

# Restore PostgreSQL
docker exec -i chorus_postgres psql -U chorus chorus < "$BACKUP_DIR/postgres_$BACKUP_DATE.sql"

# Restore Bridge data
docker exec -i chorus_bridge tar -xzf - -C / < "$BACKUP_DIR/bridge_$BACKUP_DATE.tar.gz"

# Restore Conductor data
docker exec -i chorus_conductor tar -xzf - -C / < "$BACKUP_DIR/conductor_$BACKUP_DATE.tar.gz"

echo "Restore completed!"
```

## 🧪 **Testing Deployment**

### **Integration Tests**
```bash
#!/bin/bash
# test-deployment.sh

echo "Running deployment tests..."

# Test Stage API
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:8000/api/v1/system/bridge/health || exit 1

# Test Bridge API
curl -f http://localhost:8001/health || exit 1
curl -f http://localhost:8001/api/bridge/day-proof/1 || exit 1

# Test Conductor API
curl -f http://localhost:8002/health || exit 1
curl -f http://localhost:8002/conductor/day-proof/1 || exit 1

echo "All tests passed!"
```

---

**Document Status:** Production Deployment Guide v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
