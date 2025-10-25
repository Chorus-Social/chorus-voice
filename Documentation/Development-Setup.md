# Chorus Network Development Setup

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** Development Guide

---

## Overview

This guide provides comprehensive instructions for setting up a local development environment for the Chorus Network. The setup includes all four layers: Clients, Stage, Bridge, and Conductor.

## 🛠️ **Prerequisites**

### **System Requirements**
- **Operating System**: Linux, macOS, or Windows (WSL2)
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 20GB free space
- **CPU**: 4 cores minimum, 8 cores recommended

### **Required Software**
- **Python**: 3.11+ (for Stage and Bridge)
- **Rust**: 1.70+ (for Conductor)
- **Docker**: 20.10+ (for containerized services)
- **Docker Compose**: 2.0+
- **PostgreSQL**: 15+ (for Stage database)
- **Git**: 2.30+

### **Development Tools**
- **Poetry**: 1.4+ (Python dependency management)
- **Cargo**: 1.70+ (Rust package manager)
- **Node.js**: 18+ (for client development)
- **VS Code**: Recommended IDE with extensions

## 🚀 **Quick Start**

### **1. Clone the Repository**
```bash
git clone https://github.com/Chorus-Social/chorus-stage.git
cd chorus-stage
```

### **2. Start Development Environment**
```bash
# Start all services with Docker Compose
docker-compose -f compose.yml up -d

# Or start individual services
docker-compose -f chorus-stage/compose.yml up -d
docker-compose -f chorus_bridge/docker-compose.yml up -d
docker-compose -f conductor/docker-compose.yml up -d
```

### **3. Verify Installation**
```bash
# Check Stage health
curl http://localhost:8000/health

# Check Bridge health
curl http://localhost:8001/health

# Check Conductor health
curl http://localhost:8002/health
```

## 🏗️ **Detailed Setup**

### **Chorus Stage Setup**

#### **1. Install Dependencies**
```bash
cd chorus-stage
poetry install
```

#### **2. Database Setup**
```bash
# Start PostgreSQL
docker run -d --name chorus-postgres \
  -e POSTGRES_DB=chorus \
  -e POSTGRES_USER=chorus \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Run migrations
poetry run alembic upgrade head
```

#### **3. Configuration**
```bash
# Copy example configuration
cp env.example .env

# Edit configuration
nano .env
```

**Example `.env` file:**
```env
DATABASE_URL=postgresql://chorus:password@localhost:5432/chorus
BRIDGE_BASE_URL=http://localhost:8001
BRIDGE_INSTANCE_ID=stage-dev
JWT_SECRET_KEY=your-secret-key-here
LOG_LEVEL=DEBUG
```

#### **4. Start Stage**
```bash
poetry run python -m chorus_stage.main
```

### **Chorus Bridge Setup**

#### **1. Install Dependencies**
```bash
cd chorus_bridge
poetry install
```

#### **2. Configuration**
```bash
# Copy example configuration
cp env.example .env

# Edit configuration
nano .env
```

**Example `.env` file:**
```env
BRIDGE_INSTANCE_ID=bridge-dev
CONDUCTOR_ENDPOINT=http://localhost:8002
DATABASE_URL=rocksdb://./bridge_data
NETWORK_LISTEN_ADDRESS=0.0.0.0:4001
LOG_LEVEL=DEBUG
```

#### **3. Start Bridge**
```bash
poetry run python -m chorus_bridge.main
```

### **Chorus Conductor Setup**

#### **1. Install Dependencies**
```bash
cd conductor
poetry install
```

#### **2. Generate Keys**
```bash
poetry run python generate_keys.py
```

#### **3. Configuration**
```bash
# Copy example configuration
cp validator.yaml.example validator.yaml

# Edit configuration
nano validator.yaml
```

**Example `validator.yaml` file:**
```yaml
validator:
  keypair_path: ./keys/validator_key.pem
  network:
    listen_address: 0.0.0.0:4002
    bootstrap_peers: []
  vdf:
    iterations: 86400000
    progress_interval: 1000000
    adjustment_interval_days: 10
  storage:
    backend: lmdb
    path: ./validator_data
  consensus:
    min_validators: 3
    threshold: 0.67
    timeout: 120
  monitoring:
    prometheus_port: 9090
    log_level: INFO
```

#### **4. Start Conductor**
```bash
poetry run python -m conductor.main
```

## 🔧 **Development Tools**

### **Code Quality Tools**

#### **Python (Stage & Bridge)**
```bash
# Install development dependencies
poetry install --with dev

# Run linting
poetry run ruff check .
poetry run ruff format .

# Run type checking
poetry run mypy .

# Run tests
poetry run pytest
```

#### **Rust (Conductor)**
```bash
# Install development dependencies
cargo install cargo-fmt cargo-clippy

# Run formatting
cargo fmt

# Run linting
cargo clippy

# Run tests
cargo test
```

### **Database Tools**

#### **PostgreSQL (Stage)**
```bash
# Connect to database
psql -h localhost -U chorus -d chorus

# Run migrations
poetry run alembic upgrade head

# Create new migration
poetry run alembic revision --autogenerate -m "description"
```

#### **LMDB (Conductor)**
```bash
# View database contents
poetry run python -c "
import lmdb
env = lmdb.open('./validator_data')
with env.begin() as txn:
    for key, value in txn.cursor():
        print(f'{key}: {value}')
"
```

## 🧪 **Testing**

### **Unit Tests**
```bash
# Stage tests
cd chorus-stage
poetry run pytest tests/

# Bridge tests
cd chorus_bridge
poetry run pytest tests/

# Conductor tests
cd conductor
cargo test
```

### **Integration Tests**
```bash
# Start test environment
docker-compose -f tests/docker-compose.test.yml up -d

# Run integration tests
poetry run pytest tests/integration/
```

### **Load Tests**
```bash
# Install load testing tools
pip install locust

# Run load tests
locust -f tests/load_test.py --host=http://localhost:8000
```

## 🐛 **Debugging**

### **Logging Configuration**
```python
# Stage logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Bridge logging
import structlog
logger = structlog.get_logger()

# Conductor logging
import loguru
loguru.logger.add("conductor.log", level="DEBUG")
```

### **Database Debugging**
```bash
# PostgreSQL debugging
psql -h localhost -U chorus -d chorus -c "SELECT * FROM users LIMIT 10;"

# LMDB debugging
poetry run python -c "
import lmdb
env = lmdb.open('./validator_data')
print(f'Database size: {env.stat()}')
"
```

### **Network Debugging**
```bash
# Check service connectivity
curl -v http://localhost:8000/health
curl -v http://localhost:8001/health
curl -v http://localhost:8002/health

# Check gRPC connectivity
grpcurl -plaintext localhost:50051 list
```

## 📊 **Monitoring**

### **Prometheus Metrics**
```bash
# Stage metrics
curl http://localhost:8000/metrics

# Bridge metrics
curl http://localhost:8001/metrics

# Conductor metrics
curl http://localhost:8002/metrics
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

## 🔄 **Development Workflow**

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... edit code ...

# Run tests
poetry run pytest
cargo test

# Commit changes
git add .
git commit -m "Add new feature"
```

### **2. Code Review**
```bash
# Push branch
git push origin feature/new-feature

# Create pull request
# ... use GitHub/GitLab interface ...
```

### **3. Deployment**
```bash
# Build Docker images
docker build -t chorus/stage:dev .
docker build -t chorus/bridge:dev .
docker build -t chorus/conductor:dev .

# Deploy to development environment
docker-compose -f docker-compose.dev.yml up -d
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Database Connection Errors**
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Check connection
psql -h localhost -U chorus -d chorus -c "SELECT 1;"
```

#### **Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :8000
netstat -tulpn | grep :8001
netstat -tulpn | grep :8002

# Kill conflicting processes
sudo kill -9 $(lsof -t -i:8000)
```

#### **Dependency Issues**
```bash
# Clear Poetry cache
poetry cache clear --all pypi

# Reinstall dependencies
poetry install --no-cache
```

### **Performance Issues**

#### **Slow VDF Computation**
```bash
# Check CPU usage
top -p $(pgrep -f conductor)

# Adjust VDF difficulty
# Edit validator.yaml
vdf:
  iterations: 1000000  # Reduced for development
```

#### **Memory Issues**
```bash
# Check memory usage
free -h
docker stats

# Increase Docker memory limit
# Edit Docker Desktop settings
```

## 📚 **Additional Resources**

### **Documentation**
- [Architecture Overview](./Architecture-Overview.md)
- [API Reference](./API-Reference.md)
- [Configuration Guide](./Configuration-Guide.md)

### **External Tools**
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [Docker Documentation](https://docs.docker.com/)

### **Community**
- [GitHub Discussions](https://github.com/Chorus-Social/chorus-stage/discussions)
- [Discord Server](https://discord.gg/chorus)
- [Email Support](mailto:documentation@chorus-social.net)

### **Repository Links**
- **[Chorus Stage](https://github.com/Chorus-Social/chorus-stage)** - User-facing API server
- **[Chorus Bridge](https://github.com/Chorus-Social/chorus-bridge)** - Federation and replication layer  
- **[Chorus Conductor](https://github.com/Chorus-Social/conductor)** - Consensus engine
- **[Chorus Social](https://github.com/Chorus-Social)** - Organization home page

---

**Document Status:** Development Guide v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
