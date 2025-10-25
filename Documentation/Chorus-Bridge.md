# Chorus Bridge

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** Component Documentation

---

## Overview

**Chorus Bridge** is the replication and federation layer of the Chorus ecosystem. It serves as the communication backbone that connects multiple **Chorus Stage** instances, enabling them to act as exact 1:1 mirrors of each other. Bridge manages the secure, anonymous, and high-speed propagation of user actions across the federated network.

## 🏗️ **Architecture**

```
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│  Chorus Stage A   │       │  Chorus Stage B   │       │  Chorus Stage C   │
└─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘
          │                           │                           │
          │ REST/gRPC                 │ REST/gRPC                 │ REST/gRPC
          ▼                           ▼                           ▼
    ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
    │  Bridge A   │◄───────────►│  Bridge B   │◄───────────►│  Bridge C   │
    └──────┬──────┘   P2P        └──────┬──────┘   P2P        └──────┬──────┘
           │        (libp2p/gRPC)        │                            │
           │                             │                            │
           │                             ▼                            │
           │                    ┌─────────────────┐                  │
           └───────────────────►│   Conductor     │◄─────────────────┘
                                │  (BFT Consensus)│
                                └─────────────────┘
```

## 🔑 **Core Responsibilities**

### **Stage-to-Stage Replication**
- Receive federation events from Stage instances (via REST/gRPC API)
- Validate, sign, and relay events to all trusted peer Bridges
- Ensure all Stages receive identical copies of events in the same order

### **Consensus Integration**
- Submit batches of events to **Conductor** for BFT ordering and commitment
- Receive finalized blocks from Conductor and update local state
- Only relay events that have been committed by Conductor (finalized)

### **Network Health & Blacklisting**
- Monitor peer Bridges for malicious behavior (VDF cheating, replay attacks, invalid signatures)
- Collaborate with Conductor to vote on blacklisting bad actors
- Relay blacklist updates to all Stage instances so they stop federating with malicious peers

### **ActivityPub Export (Optional)**
- Export approved public content to ActivityPub (Mastodon, etc.) via one-way bridge
- Never import content from ActivityPub (maintains privacy and prevents contamination)

## 🛠️ **Technology Stack**

- **Framework**: FastAPI (Python) or gRPC (Rust/Go for performance)
- **P2P Networking**: libp2p (Kademlia DHT, gossipsub)
- **Cryptography**: Ed25519 (signatures), BLAKE3 (hashing)
- **Storage**: Embedded KV store (RocksDB or LMDB) for event log and blacklists
- **Consensus Integration**: gRPC client to Conductor
- **Observability**: Prometheus metrics, structured logging

## 📊 **Data Models**

### **Federation Envelope (Wire Format)**
```protobuf
syntax = "proto3";
package chorus;

message FederationEnvelope {
  string sender_instance = 1;      // Bridge instance ID
  uint64 nonce = 2;                // Anti-replay nonce
  string message_type = 3;         // "PostAnnouncement", "UserRegistration", etc.
  bytes message_data = 4;          // Serialized event payload
  bytes signature = 5;             // Ed25519 signature over message_data
}
```

### **Event Types**

#### PostAnnouncement
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

#### UserRegistration
```protobuf
message UserRegistration {
  bytes pubkey_hash = 1;
  int32 creation_day = 2;
  bytes signature = 3;
}
```

#### ModerationEvent
```protobuf
message ModerationEvent {
  bytes target_ref = 1;            // Post/user hash
  string action = 2;               // "flag", "hide", "ban"
  bytes reason_hash = 3;           // BLAKE3(reason)
  bytes moderator_pubkey_hash = 4;
  int32 creation_day = 5;
}
```

#### DayProof
```protobuf
message DayProof {
  int32 day_number = 1;
  bytes proof_hash = 2;            // BLAKE3(VDF proof)
  bytes quorum_signature = 3;      // BFT quorum certificate
}
```

## 🔌 **API Surface**

### **Stage-to-Bridge API (Inbound)**

#### `POST /api/bridge/federation/send`
- **Purpose**: Stage submits a federation event to Bridge
- **Headers**:
  ```
  Authorization: Bearer <jwt>
  Idempotency-Key: <uuid>
  Content-Type: application/octet-stream
  ```
- **Body**: Serialized `FederationEnvelope`
- **Responses**:
  - `202 Accepted`: Event queued for consensus
  - `400 Bad Request`: Malformed envelope
  - `401 Unauthorized`: Invalid signature/auth
  - `409 Conflict`: Duplicate event (replay detected)

#### `GET /api/bridge/day-proof/{day}`
- **Purpose**: Stage retrieves canonical day proof for account age validation
- **Response**:
  ```json
  {
    "day_number": 1234,
    "proof": "hex",
    "canonical": true,
    "proof_hash": "hex"
  }
  ```

#### `POST /api/bridge/export`
- **Purpose**: Export public content to ActivityPub (one-way)
- **Request**:
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
- **Response**: `202 Accepted` or `409 Conflict` (blocked by policy)

### **Bridge-to-Bridge API (P2P)**

#### Gossipsub Topics
- `/chorus/events/{day}`: Federation events for a specific day
- `/chorus/proofs`: Day proof announcements
- `/chorus/blacklist`: Blacklist updates

#### Direct RPC (gRPC)
- `SubmitEvent(FederationEnvelope)`: Submit event to peer
- `RequestDayProof(day: int32)`: Request canonical day proof
- `RequestBlacklist()`: Request current blacklist

### **Bridge-to-Conductor API (Consensus)**

#### `POST /conductor/submit-batch`
- **Purpose**: Submit batch of events for BFT ordering
- **Request**:
  ```json
  {
    "epoch": 1234,
    "events": ["hex-hash-1", "hex-hash-2"]
  }
  ```
- **Response**:
  ```json
  {
    "batch_id": "hex",
    "status": "pending"
  }
  ```

#### `GET /conductor/block/{epoch}`
- **Purpose**: Retrieve finalized block for an epoch
- **Response**:
  ```json
  {
    "epoch": 1234,
    "block_hash": "hex",
    "events": ["hex-hash-1", "hex-hash-2"],
    "quorum_cert": "hex"
  }
  ```

## 🔄 **Consensus & Replication Flow**

### **Event Submission (Stage → Bridge)**
1. Stage creates user action (post, vote, etc.)
2. Stage submits `FederationEnvelope` to local Bridge via REST API
3. Bridge validates signature, checks replay cache
4. Bridge adds event to pending batch

### **P2P Gossip (Bridge ↔ Bridge)**
1. Bridge publishes event to gossipsub topic `/chorus/events/{day}`
2. Peer Bridges receive event, validate signature, add to local batch
3. Anti-replay: Each Bridge maintains a cache of seen event hashes (24hr TTL)

### **Consensus (Bridge → Conductor)**
1. Bridge accumulates events for current epoch (aligned with day number)
2. Bridge submits batch of event hashes to Conductor via gRPC
3. Conductor runs BFT consensus (leaderless ABFT with threshold encryption)
4. Conductor returns finalized block with quorum certificate

### **Finalization (Conductor → Bridge → Stage)**
1. Bridge receives finalized block from Conductor
2. Bridge marks events as committed, relays to all local Stages
3. Stages update local databases with federated events

### **Speed Target: 5 Seconds**
- **Gossip propagation**: <1 second (libp2p gossipsub)
- **Consensus finalization**: 2-3 seconds (ABFT with VDF day proofs)
- **Stage update**: <1 second (local database write)
- **Total**: ~5 seconds from user action to network-wide replication

## 🚫 **Blacklist & Malicious Node Removal**

### **Detection**
Bridge monitors for:
- **VDF cheating**: Nodes claiming day proofs faster than VDF allows
- **Invalid signatures**: Nodes submitting malformed or unsigned events
- **Replay attacks**: Nodes resubmitting old events
- **Byzantine behavior**: Nodes submitting conflicting data

### **Voting**
- Bridge submits evidence to Conductor
- Conductor facilitates BFT vote among all Bridges
- If 2/3+ majority agrees, node is blacklisted

### **Enforcement**
- Conductor relays blacklist update to all Bridges
- Bridges relay blacklist to all Stages
- Stages stop accepting federation events from blacklisted Bridges
- Blacklisted nodes are excluded from gossipsub and consensus

### **Recovery**
- Blacklisted nodes can appeal via governance process
- If 2/3+ majority votes to unblock, node is restored

## 🛡️ **Privacy & Security**

### **No Timestamp Leakage**
- All events use `creation_day` (integer) and `order_index` (within-day)
- No wall-clock timestamps transmitted or stored

### **Content Hashing**
- Post bodies, reasons, and other large data are transmitted as BLAKE3 hashes
- Full content stored only on originating Stage and requesting Stages

### **Signature Verification**
- All `FederationEnvelope` messages signed with Ed25519
- Bridges verify signatures before relaying

### **Replay Protection**
- Each envelope includes a nonce and sender instance ID
- Bridges maintain a cache of seen `(sender, nonce, message_hash)` tuples (24hr TTL)
- Duplicate envelopes are rejected with `409 Conflict`

### **mTLS & Encrypted Transport**
- All Bridge-to-Bridge communication uses mTLS or libp2p secure channels
- Stage-to-Bridge communication uses HTTPS with JWT authentication

## 🌐 **Network Participation**

### **Joining the Network**
1. Deploy a new Bridge instance
2. Generate Ed25519 keypair for instance identity
3. Submit `InstanceJoinRequest` to an existing Bridge
4. Existing Bridges relay request to Conductor
5. Conductor facilitates BFT vote; if approved, new Bridge is added to trust store
6. New Bridge receives bootstrap data (recent blocks, blacklist)

### **Trust Store**
```yaml
bridge:
  instance_id: bridge-1.chorus.social
  private_key_path: /keys/bridge.key
  trusted_peers:
    - id: bridge-2.chorus.social
      pubkey: hex-encoded-ed25519
      endpoint: https://bridge-2.chorus.social
    - id: bridge-3.chorus.social
      pubkey: hex-encoded-ed25519
      endpoint: https://bridge-3.chorus.social
```

### **Bootstrap & Synchronization**
- New Bridge requests recent blocks from peers
- Conductor provides VDF proofs for all historical days
- Bridge reconstructs state from finalized blocks

## 📊 **Observability**

### **Metrics (Prometheus)**
- `bridge_events_received_total{type}`
- `bridge_events_relayed_total{type}`
- `bridge_consensus_latency_seconds`
- `bridge_peer_latency_seconds{peer_id}`
- `bridge_blacklist_size`

### **Logging**
- Structured JSON logs (no PII)
- Log event hashes, peer IDs, consensus decisions
- Never log full post bodies or user-identifiable data

### **Health Endpoints**
- `GET /health/live`: Liveness probe
- `GET /health/ready`: Readiness probe (checks Conductor connectivity, peer count)

## 🚀 **Deployment**

### **Docker Compose Example**
```yaml
version: "3.8"
services:
  bridge:
    image: chorus/bridge:latest
    ports: ["443:443", "9090:9090", "4001:4001"]
    environment:
      - BRIDGE_INSTANCE_ID=bridge-1.chorus.social
      - CONDUCTOR_ENDPOINT=https://conductor.chorus.local
      - DATABASE_URL=rocksdb://./bridge_data
    volumes:
      - ./keys:/app/keys
      - ./bridge.yaml:/app/bridge.yaml
      - bridge_data:/app/bridge_data

volumes:
  bridge_data:
```

### **Configuration (bridge.yaml)**
```yaml
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
    endpoint: https://conductor.chorus.local
    timeout_seconds: 30

  storage:
    backend: rocksdb
    path: ./bridge_data

  security:
    replay_cache_ttl_seconds: 86400
    rate_limit_per_peer_rps: 10

  monitoring:
    prometheus_port: 9090
    log_level: INFO
```

## 🧪 **Testing**

- Unit tests for envelope validation and signature verification
- Integration tests with mock Conductor and peer Bridges
- Load tests for gossip propagation and consensus latency
- Chaos tests: network partitions, malicious peers, Byzantine failures

## 🔮 **Future Directions**

- **Adaptive Gossip**: Optimize gossipsub parameters based on network conditions
- **Differential Privacy**: Add noise to event timing for enhanced anonymity
- **Sharding**: Partition network by community for scalability

---

**Document Status:** Component Documentation v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
