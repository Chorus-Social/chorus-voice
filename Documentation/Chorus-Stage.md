# Chorus Stage

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** Component Documentation

---

## Overview

**Chorus Stage** is the user-facing server that manages accounts, content, and moderation for a specific instance. It serves as the primary interface between **Chorus Clients** and the broader Chorus ecosystem, enforcing strict privacy guarantees while participating in federation.

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────┐
│        Chorus Clients                   │
│  (Web, Mobile, Desktop, 3rd Party)     │
└──────────────┬──────────────────────────┘
               │
               │ REST / WebSocket
               │ (HTTPS, JWT Auth)
               ▼
       ┌───────────────────┐
       │   Chorus Stage    │
       │    (FastAPI)      │
       │                   │
       │  ┌─────────────┐  │
       │  │ PostgreSQL  │  │
       │  │  Database   │  │
       │  └─────────────┘  │
       └──────────┬────────┘
                  │
                  │ Bridge Integration
                  │ (REST API / gRPC)
                  ▼
          ┌───────────────────┐
          │   Chorus Bridge   │
          └───────────────────┘
```

## 🔑 **Core Responsibilities**

### **Client-Server Communication**
- Expose REST and WebSocket APIs for client interactions
- Authenticate users via Ed25519 public-key cryptography
- Enforce rate limits and tier-based access controls

### **Data Management**
- Store user accounts, posts, votes, messages, communities, and moderation events in PostgreSQL
- Use **day numbers** and **order IDs** instead of timestamps for all temporal data
- Encrypt sensitive data (e.g., direct messages) at rest

### **Federation Integration**
- Submit new user actions (posts, votes, registrations) to **Chorus Bridge** for federation
- Receive federated events from Bridge and update local state accordingly
- Never expose timestamps to Bridge; only day numbers, hashes, and anonymized identifiers

### **Privacy Enforcement**
- Reject any API request or data model that includes real-world timestamps
- Store only cryptographic hashes of user public keys (not full public keys unless required for encryption)
- Implement data minimization: if data is not essential, do not store it

## 🛠️ **Technology Stack**

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **Cryptography**: `cryptography` (Ed25519), `pynacl` (NaCl for E2E encryption)
- **Hashing**: BLAKE3 for all content hashing
- **WebSockets**: `fastapi.WebSocket` for real-time updates
- **Background Tasks**: FastAPI background tasks
- **Observability**: Prometheus metrics, structured logging (JSON)

## 📊 **Database Schema**

### **Users Table**
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  pubkey_hash CHAR(64) UNIQUE NOT NULL,  -- BLAKE3(pubkey)
  creation_day INTEGER NOT NULL,
  tier VARCHAR(20) NOT NULL DEFAULT 'new',  -- 'new', 'veteran'
  accent_color CHAR(7),  -- Optional hex color
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- Internal only, never exposed
  INDEX (pubkey_hash)
);
```

### **Posts Table**
```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  post_id CHAR(64) UNIQUE NOT NULL,  -- BLAKE3(content)
  author_pubkey_hash CHAR(64) NOT NULL,
  body_md TEXT NOT NULL,
  creation_day INTEGER NOT NULL,
  order_index INTEGER NOT NULL,  -- Within-day ordering
  community VARCHAR(100),
  vote_score INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- Internal only
  FOREIGN KEY (author_pubkey_hash) REFERENCES users(pubkey_hash),
  INDEX (creation_day, order_index),
  INDEX (community)
);
```

### **Votes Table**
```sql
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  vote_id CHAR(64) UNIQUE NOT NULL,
  target_post_id CHAR(64) NOT NULL,
  voter_pubkey_hash CHAR(64) NOT NULL,
  vote_type VARCHAR(10) NOT NULL,  -- 'positive', 'negative', 'neutral'
  creation_day INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- Internal only
  FOREIGN KEY (target_post_id) REFERENCES posts(post_id),
  FOREIGN KEY (voter_pubkey_hash) REFERENCES users(pubkey_hash),
  UNIQUE (target_post_id, voter_pubkey_hash)
);
```

### **Messages Table (E2E Encrypted)**
```sql
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  message_id CHAR(64) UNIQUE NOT NULL,
  sender_pubkey_hash CHAR(64) NOT NULL,
  recipient_pubkey_hash CHAR(64) NOT NULL,
  encrypted_body TEXT NOT NULL,  -- NaCl Box encrypted
  creation_day INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- Internal only
  FOREIGN KEY (sender_pubkey_hash) REFERENCES users(pubkey_hash),
  FOREIGN KEY (recipient_pubkey_hash) REFERENCES users(pubkey_hash),
  INDEX (sender_pubkey_hash, recipient_pubkey_hash),
  INDEX (creation_day, order_index)
);
```

## 🔌 **API Surface**

### **Base URL**
```
https://{stage_domain}/api/v1
```

### **Authentication Endpoints**

#### `GET /auth/challenge`
- **Purpose**: Request a cryptographic challenge for login
- **Response**:
  ```json
  {
    "challenge": "hex-bytes",
    "expires_in": 300
  }
  ```

#### `POST /auth/login`
- **Purpose**: Authenticate user with signed challenge
- **Request**:
  ```json
  {
    "pubkey_hash": "hex",
    "signature": "hex"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt",
    "expires_in": 3600
  }
  ```

#### `POST /auth/register`
- **Purpose**: Register new user with PoW and signed challenge
- **Request**:
  ```json
  {
    "pubkey_hash": "hex",
    "pow_nonce": "hex",
    "signature": "hex"
  }
  ```
- **Response**:
  ```json
  {
    "user_id": "hex",
    "creation_day": 1234,
    "tier": "new"
  }
  ```

### **Post Endpoints**

#### `POST /posts/create`
- **Purpose**: Create a new post
- **Request**:
  ```json
  {
    "body_md": "# Hello World",
    "community": "general"
  }
  ```
- **Response**:
  ```json
  {
    "post_id": "hex",
    "creation_day": 1234,
    "order_index": 567
  }
  ```

#### `GET /posts/feed`
- **Purpose**: Retrieve feed (paginated, sorted by day/order)
- **Query Params**: `?community=general&limit=50&after_day=1234&after_order=567`
- **Response**:
  ```json
  {
    "posts": [
      {
        "post_id": "hex",
        "author_pubkey_hash": "hex",
        "body_md": "...",
        "creation_day": 1234,
        "order_index": 567,
        "vote_score": 42
      }
    ],
    "next_cursor": { "day": 1234, "order": 600 }
  }
  ```

### **Vote Endpoints**

#### `POST /votes/cast`
- **Purpose**: Cast a vote on a post
- **Request**:
  ```json
  {
    "target_post_id": "hex",
    "vote_type": "positive"
  }
  ```
- **Response**:
  ```json
  {
    "vote_id": "hex",
    "creation_day": 1234
  }
  ```

### **Message Endpoints**

#### `POST /messages/send`
- **Purpose**: Send E2E encrypted direct message
- **Request**:
  ```json
  {
    "recipient_pubkey_hash": "hex",
    "encrypted_body": "hex"
  }
  ```
- **Response**:
  ```json
  {
    "message_id": "hex",
    "creation_day": 1234,
    "order_index": 123
  }
  ```

### **WebSocket Endpoint**

#### `wss://{stage_domain}/ws/feed`
- **Purpose**: Real-time feed updates
- **Events**:
  - `new_post`: New post announcement
  - `new_vote`: Vote cast on a post
  - `moderation_update`: Moderation action taken
- **Example Event**:
  ```json
  {
    "type": "new_post",
    "data": {
      "post_id": "hex",
      "creation_day": 1234,
      "order_index": 567
    }
  }
  ```

## 🌉 **Bridge Integration**

### **Configuration**
Stage instances are configured with a Bridge connection:
```yaml
bridge:
  enabled: true
  base_url: https://bridge.chorus.local
  instance_id: stage-1
  mtls_enabled: true
  jwks_url: https://bridge.chorus.local/.well-known/jwks.json
  jwt_issuer: stage-1
  jwt_audience: chorus-bridge
  token_ttl_seconds: 300
```

### **Outbound Events (Stage → Bridge)**

#### Day Proof Retrieval
```
GET {BRIDGE_BASE_URL}/api/bridge/day-proof/{day}
```
- Purpose: Fetch canonical day proof for account age validation

#### Federation Message Relay
```
POST {BRIDGE_BASE_URL}/api/bridge/federation/send
Headers:
  Authorization: Bearer <jwt>
  Idempotency-Key: <uuid>
  Content-Type: application/octet-stream
Body: serialized FederationEnvelope
```
- Purpose: Submit user actions (posts, votes, registrations) to Bridge for federation

### **Inbound Events (Bridge → Stage)**
- Bridge relays validated events (posts, votes, moderation) from other Stages
- Stage validates signature, checks blacklist, updates local database

## 🛡️ **Privacy & Security**

### **No Timestamp Exposure**
- Internal database timestamps (`created_at`) are **never** exposed via API
- All temporal data uses `creation_day` (integer) and `order_index`

### **Data Minimization**
- Only store cryptographic hashes of public keys (unless full key needed for encryption)
- No persistent device identifiers, IP addresses, or user-agent strings

### **End-to-End Encryption (Messages)**
- Direct messages are encrypted client-side with NaCl Box
- Stage stores only ciphertext; cannot decrypt

### **Rate Limiting**
```yaml
rate_limits:
  posts_create_per_day:
    tier_new: 5
    tier_veteran: 50
  votes_cast_per_day:
    tier_new: 20
    tier_veteran: 100
  federation_ingress_rps:
    default: 10
    burst: 50
```

### **Proof-of-Work (Registration)**
- New users must complete a BLAKE3-based PoW challenge to register
- Difficulty adjustable via configuration

## 📊 **Observability**

### **Metrics (Prometheus)**
- `stage_requests_total{endpoint, code}`
- `stage_db_queries_total{table}`
- `stage_bridge_requests_total{endpoint, code}`
- `stage_feed_events_total{type}`

### **Logging**
- Structured JSON logs (no PII)
- Include request IDs and envelope hashes (not content)

### **Health Endpoints**
- `GET /health/live` — Liveness probe
- `GET /health/ready` — Readiness probe (checks DB and Bridge connectivity)
- `GET /api/v1/system/bridge/health` — Bridge-specific health check with circuit breaker status
- `GET /api/v1/system/bridge/metrics` — Bridge operation metrics and performance data

## 🚀 **Deployment**

### **Docker Compose Example**
```yaml
version: "3.8"
services:
  stage:
    image: chorus/stage:latest
    ports: ["443:443", "9090:9090"]
    environment:
      - DATABASE_URL=postgresql://chorus:password@db:5432/chorus
      - BRIDGE_BASE_URL=https://bridge.chorus.local
      - BRIDGE_INSTANCE_ID=stage-1
    depends_on: [db]
    volumes:
      - ./keys:/app/keys
      - ./stage.yaml:/app/stage.yaml

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=chorus
      - POSTGRES_USER=chorus
      - POSTGRES_PASSWORD=password
    volumes:
      - stage_db:/var/lib/postgresql/data

volumes:
  stage_db:
```

## 🧪 **Testing**

- Unit tests for API endpoints
- Integration tests with mock Bridge
- Load tests for rate limiting and concurrency
- Privacy audits: ensure no timestamps leak

## 🔮 **Future Directions**

- **Multi-tenant Stage**: Support multiple instances per deployment
- **Advanced Moderation Tools**: AI-assisted flagging
- **Enhanced Privacy**: Onion routing for federation

---

**Document Status:** Component Documentation v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
