# Chorus Network Data Flow

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** Technical Documentation

---

## Overview

This document describes how data flows through the Chorus Network from user action to network-wide replication. The Chorus Network uses a four-layer architecture with strict privacy guarantees and time-agnostic consensus.

## 🔄 **Complete Data Flow**

### **User Posts Content (Full Lifecycle)**

1. **User creates post** in Chorus Client (Layer 1)
2. Client sends `POST /posts/create` to Chorus Stage (Layer 2)
3. Stage authenticates user (JWT), validates request, assigns `creation_day` and `order_index`
4. Stage stores post in PostgreSQL database
5. Stage submits `FederationEnvelope` (type: `PostAnnouncement`) to local Bridge (Layer 3) via `POST /api/bridge/federation/send`
6. Bridge validates signature, checks replay cache, adds event to pending batch
7. Bridge gossips event to all peer Bridges via libp2p gossipsub
8. Peer Bridges receive event, validate, add to their local batches
9. Bridge submits batch of event hashes to Conductor (Layer 4) via `POST /conductor/submit-batch`
10. Conductor runs BFT consensus: collects batches from all Bridges, orders events, generates quorum certificate
11. Conductor finalizes block and publishes to all Bridges via `GET /conductor/block/{epoch}`
12. Bridges relay finalized events to their respective Stages
13. Stages update local databases with federated posts
14. Stages push real-time updates to connected clients via WebSocket

**Timing**: Target <5 seconds from step 2 to step 14

---

### **Day Advancement (VDF Consensus)**

1. Conductor computes VDF proof for current day (sequential BLAKE3 hashing, ~24 hours)
2. Conductor publishes VDF proof to all peer Conductors
3. Peers verify proof (fast, logarithmic time)
4. If 2/3+ peers submit valid proofs for the same day, day is finalized
5. Conductor advances internal day counter: `true_day += 1`
6. Conductor publishes canonical day proof to all Bridges
7. Bridges cache day proof and provide to Stages via `GET /api/bridge/day-proof/{day}`
8. Stages use day proof to validate account ages and enforce rate limits

**Timing**: ~24 hours per day (on reference hardware), adjusted dynamically

---

### **Malicious Node Detection & Blacklisting**

1. Conductor detects anomaly (e.g., peer completes VDF proof in 1 hour instead of 24 hours)
2. Conductor collects evidence (proof timestamps, verification failures)
3. Conductor submits evidence and blacklist proposal to peer Conductors
4. Peer Conductors vote: approve or reject blacklist
5. If 2/3+ vote to blacklist, node is added to blacklist with quorum certificate
6. Conductor relays blacklist update to all Bridges
7. Bridges disconnect from blacklisted node and ignore its events
8. Bridges relay blacklist to all Stages
9. Stages stop accepting federation events from blacklisted instances

---

## 📊 **Data Flow Diagrams**

### **User Action Flow**
```
┌─────────────┐    POST /posts/create    ┌─────────────┐
│   Client    │ ───────────────────────► │    Stage    │
└─────────────┘                          └──────┬──────┘
                                                │
                                                │ Store in DB
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │ PostgreSQL  │
                                         └─────────────┘
```

### **Federation Flow**
```
┌─────────────┐    FederationEnvelope    ┌─────────────┐
│    Stage    │ ───────────────────────► │   Bridge    │
└─────────────┘                          └──────┬──────┘
                                                │
                                                │ Gossip to Peers
                                                ▼
                                         ┌─────────────┐
                                         │ Peer Bridge │
                                         └─────────────┘
```

### **Consensus Flow**
```
┌─────────────┐    Event Batch    ┌─────────────┐
│   Bridge    │ ────────────────► │  Conductor  │
└─────────────┘                   └──────┬──────┘
                                         │
                                         │ BFT Consensus
                                         ▼
                                   ┌─────────────┐
                                   │ Finalized   │
                                   │ Block       │
                                   └─────────────┘
```

---

## 🔐 **Privacy Guarantees**

### **No Timestamp Leakage**
- All temporal data uses `creation_day` (integer) and `order_index`
- No wall-clock timestamps transmitted or stored
- Conductor's internal day counter is RAM-only (ephemeral)

### **Content Hashing**
- Post bodies transmitted as BLAKE3 hashes
- Full content stays on originating Stage
- Peers request content only when needed

### **Cryptographic Signatures**
- All messages signed with Ed25519
- Replay protection via nonce and sender instance ID
- Blacklist enforcement via BFT voting

---

## ⚡ **Performance Targets**

| Stage                    | Target Time |
|--------------------------|-------------|
| Client → Stage          | <100ms      |
| Stage → Bridge          | <50ms       |
| Bridge Gossip           | <1 second   |
| Consensus Finalization  | 2-3 seconds |
| Stage Database Update   | <1 second   |
| **Total Propagation**   | **<5 seconds** |

---

## 🛡️ **Security Measures**

### **Replay Protection**
- Each envelope includes nonce and sender instance ID
- Bridges maintain cache of seen `(sender, nonce, message_hash)` tuples
- 24-hour TTL for replay cache

### **Rate Limiting**
- Per-user tier-based limits (new vs. veteran users)
- Per-instance federation quotas
- Circuit breakers for Bridge connectivity

### **Blacklist Enforcement**
- BFT voting to remove malicious nodes
- Automatic disconnection from blacklisted peers
- Evidence-based blacklisting (VDF cheating, invalid signatures)

---

## 🔄 **Error Handling**

### **Network Partitions**
- Asynchronous BFT consensus tolerates network delays
- Gossipsub provides eventual consistency
- Circuit breakers prevent cascade failures

### **Byzantine Failures**
- Up to f < n/3 malicious nodes tolerated
- Quorum certificates ensure finality
- Blacklist voting removes bad actors

### **VDF Anomalies**
- Outlier detection for ASIC cheating
- Dynamic difficulty adjustment
- Evidence collection for blacklisting

---

## 📈 **Monitoring & Observability**

### **Key Metrics**
- `stage_requests_total{endpoint, code}`
- `bridge_events_received_total{type}`
- `conductor_consensus_latency_seconds`
- `conductor_vdf_duration_seconds`

### **Health Checks**
- Stage: Database connectivity, Bridge health
- Bridge: Conductor connectivity, peer count
- Conductor: VDF engine status, peer connectivity

### **Logging**
- Structured JSON logs (no PII)
- Request IDs and envelope hashes
- Never log full content or timestamps

---

## 🔮 **Future Enhancements**

### **Sharding**
- Partition network by community or geography
- Reduce consensus overhead for large networks
- Maintain privacy guarantees across shards

### **Zero-Knowledge Proofs**
- Prove VDF completion without revealing intermediate state
- Enhanced privacy for consensus participants
- Reduced communication overhead

### **Differential Privacy**
- Add noise to event timing for enhanced anonymity
- Protect against timing correlation attacks
- Maintain network functionality

---

**Document Status:** Technical Documentation v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
