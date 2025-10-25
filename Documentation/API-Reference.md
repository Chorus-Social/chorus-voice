# Chorus Network API Reference

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** API Documentation

---

## Overview

This document provides comprehensive API reference for all Chorus Network components: Stage, Bridge, and Conductor. Each component exposes specific endpoints for different use cases.

## 🎭 **Chorus Stage API**

### **Base URL**
```
https://{stage_domain}/api/v1
```

### **Authentication**

#### `GET /auth/challenge`
Request a cryptographic challenge for login.

**Response:**
```json
{
  "challenge": "hex-bytes",
  "expires_in": 300
}
```

#### `POST /auth/login`
Authenticate user with signed challenge.

**Request:**
```json
{
  "pubkey_hash": "hex",
  "signature": "hex"
}
```

**Response:**
```json
{
  "token": "jwt",
  "expires_in": 3600
}
```

#### `POST /auth/register`
Register new user with PoW and signed challenge.

**Request:**
```json
{
  "pubkey_hash": "hex",
  "pow_nonce": "hex",
  "signature": "hex"
}
```

**Response:**
```json
{
  "user_id": "hex",
  "creation_day": 1234,
  "tier": "new"
}
```

### **Posts**

#### `POST /posts/create`
Create a new post.

**Request:**
```json
{
  "body_md": "# Hello World",
  "community": "general"
}
```

**Response:**
```json
{
  "post_id": "hex",
  "creation_day": 1234,
  "order_index": 567
}
```

#### `GET /posts/feed`
Retrieve feed (paginated, sorted by day/order).

**Query Parameters:**
- `community`: Filter by community
- `limit`: Number of posts to return (default: 50)
- `after_day`: Pagination cursor - day number
- `after_order`: Pagination cursor - order index

**Response:**
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

#### `GET /posts/{post_id}`
Retrieve a single post by ID.

**Response:**
```json
{
  "post_id": "hex",
  "author_pubkey_hash": "hex",
  "body_md": "...",
  "creation_day": 1234,
  "order_index": 567,
  "vote_score": 42
}
```

### **Votes**

#### `POST /votes/cast`
Cast a vote on a post.

**Request:**
```json
{
  "target_post_id": "hex",
  "vote_type": "positive"
}
```

**Response:**
```json
{
  "vote_id": "hex",
  "creation_day": 1234
}
```

#### `GET /votes/post/{post_id}`
Retrieve votes for a post.

**Response:**
```json
{
  "vote_score": 42,
  "vote_count": 100
}
```

### **Messages**

#### `POST /messages/send`
Send E2E encrypted direct message.

**Request:**
```json
{
  "recipient_pubkey_hash": "hex",
  "encrypted_body": "hex"
}
```

**Response:**
```json
{
  "message_id": "hex",
  "creation_day": 1234,
  "order_index": 123
}
```

#### `GET /messages/thread/{user_pubkey}`
Retrieve message thread with another user.

**Response:**
```json
{
  "messages": [
    {
      "message_id": "hex",
      "sender_pubkey_hash": "hex",
      "encrypted_body": "hex",
      "creation_day": 1234,
      "order_index": 123
    }
  ]
}
```

### **Communities**

#### `GET /communities`
List all communities.

**Response:**
```json
{
  "communities": [
    {
      "community_id": "general",
      "name": "General Discussion",
      "description": "...",
      "creation_day": 1
    }
  ]
}
```

#### `POST /communities/create`
Create a new community.

**Request:**
```json
{
  "community_id": "my-community",
  "name": "My Community",
  "description": "..."
}
```

**Response:**
```json
{
  "community_id": "my-community",
  "creation_day": 1234
}
```

### **Moderation**

#### `POST /moderation/flag`
Flag content for moderation.

**Request:**
```json
{
  "target_ref": "hex",
  "reason_hash": "hex"
}
```

**Response:**
```json
{
  "event_id": "hex",
  "creation_day": 1234
}
```

#### `GET /moderation/queue`
View moderation queue (requires moderator permissions).

**Response:**
```json
{
  "events": [
    {
      "event_id": "hex",
      "target_ref": "hex",
      "action": "flag",
      "creation_day": 1234
    }
  ]
}
```

### **WebSocket**

#### `wss://{stage_domain}/ws/feed`
Real-time feed updates.

**Events:**
- `new_post`: New post announcement
- `new_vote`: Vote cast on a post
- `moderation_update`: Moderation action taken

**Example Event:**
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

### **Health Endpoints**

#### `GET /health/live`
Liveness probe.

#### `GET /health/ready`
Readiness probe (checks DB and Bridge connectivity).

#### `GET /api/v1/system/bridge/health`
Bridge-specific health check with circuit breaker status.

#### `GET /api/v1/system/bridge/metrics`
Bridge operation metrics and performance data.

---

## 🌉 **Chorus Bridge API**

### **Base URL**
```
https://{bridge_domain}/api/bridge
```

### **Federation**

#### `POST /federation/send`
Submit a federation event to Bridge.

**Headers:**
```
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>
Content-Type: application/octet-stream
```

**Body:** Serialized `FederationEnvelope`

**Responses:**
- `202 Accepted`: Event queued for consensus
- `400 Bad Request`: Malformed envelope
- `401 Unauthorized`: Invalid signature/auth
- `409 Conflict`: Duplicate event (replay detected)

#### `GET /day-proof/{day}`
Retrieve canonical day proof for account age validation.

**Response:**
```json
{
  "day_number": 1234,
  "proof": "hex",
  "canonical": true,
  "proof_hash": "hex"
}
```

#### `POST /export`
Export public content to ActivityPub (one-way).

**Request:**
```json
{
  "chorus_post": {
    "post_id": "hex",
    "author_pubkey_hash": "hex",
    "body_md": "...",
    "day_number": 1234
  },
  "signature": "hex"
}
```

**Response:** `202 Accepted` or `409 Conflict` (blocked by policy)

### **Health Endpoints**

#### `GET /health/live`
Liveness probe.

#### `GET /health/ready`
Readiness probe (checks Conductor connectivity, peer count).

---

## 🎼 **Chorus Conductor API**

### **Base URL**
```
https://{conductor_domain}/conductor
```

### **Event Submission**

#### `POST /submit-batch`
Submit batch of events for ordering.

**Request:**
```json
{
  "epoch": 1234,
  "events": [
    { "type": "PostAnnouncement", "hash": "hex" },
    { "type": "UserRegistration", "hash": "hex" }
  ]
}
```

**Response:**
```json
{
  "batch_id": "hex",
  "status": "pending"
}
```

#### `GET /block/{epoch}`
Retrieve finalized block for an epoch.

**Response:**
```json
{
  "epoch": 1234,
  "block_hash": "hex",
  "merkle_root": "hex",
  "events": ["hex-1", "hex-2"],
  "quorum_cert": "hex"
}
```

#### `GET /day-proof/{day}`
Retrieve canonical VDF proof for a day.

**Response:**
```json
{
  "day_number": 1234,
  "vdf_proof": "hex",
  "difficulty": 86400000,
  "quorum_cert": "hex"
}
```

### **Health Endpoints**

#### `GET /health/live`
Liveness probe.

#### `GET /health/ready`
Readiness probe (checks peer connectivity, VDF engine status).

---

## 🔐 **Authentication**

### **JWT Tokens**
All API requests require JWT authentication with the following claims:

```json
{
  "sub": "user_pubkey_hash",
  "iss": "stage_instance_id",
  "aud": "chorus-stage",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### **Signature Verification**
All federation messages are signed with Ed25519:

```python
# Sign message
signature = private_key.sign(message_data)

# Verify signature
public_key.verify(signature, message_data)
```

---

## 📊 **Data Models**

### **FederationEnvelope**
```protobuf
message FederationEnvelope {
  string sender_instance = 1;      // Bridge instance ID
  uint64 nonce = 2;                // Anti-replay nonce
  string message_type = 3;         // "PostAnnouncement", "UserRegistration", etc.
  bytes message_data = 4;          // Serialized event payload
  bytes signature = 5;             // Ed25519 signature over message_data
}
```

### **PostAnnouncement**
```protobuf
message PostAnnouncement {
  bytes post_id = 1;               // BLAKE3(content)
  bytes author_pubkey_hash = 2;    // BLAKE3(pubkey)
  bytes content_hash = 3;          // BLAKE3(body_md)
  uint32 order_index = 4;          // Within-day ordering
  int32 creation_day = 5;          // Day number (not timestamp!)
  string community = 6;            // Optional community ID
}
```

### **UserRegistration**
```protobuf
message UserRegistration {
  bytes pubkey_hash = 1;
  int32 creation_day = 2;
  bytes signature = 3;
}
```

### **ModerationEvent**
```protobuf
message ModerationEvent {
  bytes target_ref = 1;            // Post/user hash
  string action = 2;               // "flag", "hide", "ban"
  bytes reason_hash = 3;           // BLAKE3(reason)
  bytes moderator_pubkey_hash = 4;
  int32 creation_day = 5;
}
```

### **DayProof**
```protobuf
message DayProof {
  int32 day_number = 1;
  bytes proof_hash = 2;            // BLAKE3(VDF proof)
  bytes quorum_signature = 3;      // BFT quorum certificate
}
```

---

## 🚨 **Error Handling**

### **HTTP Status Codes**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### **Error Response Format**
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### **Common Error Codes**
- `INVALID_SIGNATURE`: Cryptographic signature verification failed
- `REPLAY_DETECTED`: Duplicate message detected
- `RATE_LIMIT_EXCEEDED`: Request rate limit exceeded
- `BLACKLISTED_NODE`: Source node is blacklisted
- `CONSENSUS_ERROR`: Consensus protocol error

---

## 📈 **Rate Limiting**

### **Stage Rate Limits**
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

### **Bridge Rate Limits**
```yaml
rate_limits:
  federation_events_per_second: 100
  day_proof_requests_per_minute: 60
  export_requests_per_hour: 1000
```

### **Conductor Rate Limits**
```yaml
rate_limits:
  event_batches_per_minute: 10
  day_proof_requests_per_minute: 60
  blacklist_votes_per_hour: 100
```

---

## 🔍 **Monitoring & Metrics**

### **Prometheus Metrics**
All components expose Prometheus metrics on `/metrics`:

#### Stage Metrics
- `stage_requests_total{endpoint, code}`
- `stage_db_queries_total{table}`
- `stage_bridge_requests_total{endpoint, code}`
- `stage_feed_events_total{type}`

#### Bridge Metrics
- `bridge_events_received_total{type}`
- `bridge_events_relayed_total{type}`
- `bridge_consensus_latency_seconds`
- `bridge_peer_latency_seconds{peer_id}`
- `bridge_blacklist_size`

#### Conductor Metrics
- `conductor_vdf_duration_seconds`
- `conductor_day_number_current`
- `conductor_consensus_latency_seconds`
- `conductor_blacklist_size`
- `conductor_peer_count`

---

## 🧪 **Testing**

### **API Testing**
```bash
# Test Stage API
curl -X POST http://localhost:8000/api/v1/posts/create \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body_md": "Test post", "community": "general"}'

# Test Bridge API
curl -X GET http://localhost:8001/api/bridge/day-proof/1234

# Test Conductor API
curl -X GET http://localhost:8002/conductor/day-proof/1234
```

### **Load Testing**
```bash
# Install load testing tools
pip install locust

# Run load tests
locust -f tests/load_test.py --host=http://localhost:8000
```

---

**Document Status:** API Documentation v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
