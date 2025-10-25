# Chorus Conductor

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** Component Documentation

---

## Overview

**Chorus Conductor** is the consensus engine and network warden of the Chorus network. It is an asynchronous, leaderless Byzantine Fault-Tolerant (ABFT) consensus system designed to ensure that all **Chorus Bridge** instances remain in perfect agreement on the ordering and validity of federation events. Conductor is **the first of its kind** in that it functions without relying on real-world timestamps, instead using a protected internal "true day" counter that is never exposed directly.

## 🏗️ **Architecture**

```
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│   Bridge A        │       │   Bridge B        │       │   Bridge C        │
└─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘
          │                           │                           │
          │ gRPC/libp2p               │ gRPC/libp2p               │ gRPC/libp2p
          ▼                           ▼                           ▼
    ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
    │ Conductor A  │◄──────────►│ Conductor B  │◄──────────►│ Conductor C  │
    └──────────────┘  P2P Mesh  └──────────────┘  P2P Mesh  └──────────────┘
           │                           │                           │
           │                           │                           │
           └───────────────────────────┴───────────────────────────┘
                             VDF Proofs & Consensus
```

## 🔑 **Core Responsibilities**

### **Day Counter Management**
- Maintain an internal, protected "true day" counter (monotonic, starting from Day 0)
- Advance the day counter **only** when a valid VDF proof is verified
- Never expose the true day counter directly; only publish day proofs

### **VDF Proof Generation & Verification**
- Each Conductor instance computes a VDF proof for the current day
- VDF uses sequential BLAKE3 hashing (cannot be parallelized or shortcut)
- Proofs are fast to verify (logarithmic time) but slow to compute (~24 hours on reference hardware)

### **Consensus on Day Advancement**
- Collect VDF proofs from all participating Conductor instances
- Require 2/3+ supermajority agreement before finalizing a day
- Detect outliers (ASIC-accelerated or lagging nodes) and flag for blacklisting

### **Event Ordering & Commitment**
- Accept batches of federation events from Bridge instances
- Order events deterministically within each day (via order IDs, not timestamps)
- Commit finalized blocks with quorum certificates

### **Blacklist Management**
- Identify malicious nodes (VDF cheating, invalid signatures, Byzantine behavior)
- Facilitate BFT vote (2/3+ required) to blacklist bad actors
- Relay blacklist updates to all Bridge instances

## 🛠️ **Technology Stack**

- **Language**: Rust (for VDF performance) or Python (for prototype)
- **VDF**: Sequential BLAKE3 hashing (no parallelization possible)
- **Cryptography**: Ed25519 (signatures), BLS (threshold signatures), BLAKE3 (hashing)
- **Networking**: libp2p (gossipsub for proofs) or gRPC (for RPC)
- **Storage**: RocksDB or LMDB (for event ledger, checkpoints, day proofs)
- **Observability**: Prometheus metrics, structured logging

## ⏰ **Day Counter System**

### **True Day vs. Exposed Day**
- **True Day**: Internal monotonic counter (never exposed, never correlated with real time)
- **Exposed Day**: Day numbers published to Bridge (e.g., Day 0, Day 1, Day 2...)
- **Isolation**: True day is stored in RAM only (ephemeral), never persisted to disk
- **Purpose**: Prevents forensic reconstruction of timing from seized nodes

### **Day Advancement Flow**
1. Conductor computes VDF proof for `current_day`
2. Conductor publishes proof to peer Conductors
3. Peers verify proof (fast, logarithmic time)
4. If 2/3+ peers submit valid proofs for `current_day`, day is finalized
5. Conductor advances internal counter: `true_day += 1`
6. Publish canonical day proof to Bridge

### **Day Proof Format**
```json
{
  "day_number": 1234,
  "vdf_proof": "hex-bytes",
  "difficulty": 86400000,
  "computed_by": "conductor-1",
  "signature": "hex-signature"
}
```

### **Privacy Guarantee**
- Even with full access to Conductor's state, an adversary cannot deduce:
  - What calendar date a day corresponds to
  - How long a day took in real time
  - When events occurred in wall-clock time

## 🔐 **Verifiable Delay Functions (VDFs)**

### **Purpose**
- Prove that a certain amount of time has passed **without relying on timestamps**
- Force sequential computation (cannot be parallelized or accelerated without detection)

### **Algorithm: Sequential BLAKE3**
```python
def compute_vdf(day_number, difficulty):
    seed = BLAKE3(f"chorus-day-{day_number}")
    proof = seed
    for i in range(difficulty):
        proof = BLAKE3(proof)
    return proof
```

- **Difficulty**: Number of iterations (e.g., 86,400,000 for ~24 hours on reference hardware)
- **Proof**: Final BLAKE3 hash after all iterations
- **Verification**: Fast; re-compute and compare (or use short witness proofs)

### **Calibration**
- **Reference Hardware**: Defined standard (e.g., AWS c5.large instance)
- **Calibration Target**: VDF should take ~24 hours on reference hardware
- **Dynamic Adjustment**: If federation-wide median completion time drifts, recalibrate difficulty

### **ASIC Resistance**
- Sequential BLAKE3 is hard to accelerate with ASICs (limited parallelization)
- Nodes running ASICs will be detected as outliers (completing proofs too quickly)
- Outliers flagged for blacklisting via BFT vote

## 🗳️ **Consensus Protocol**

### **Leaderless ABFT**
- **No leader**: All Conductor instances participate equally
- **Asynchronous**: No timing assumptions; consensus achieved via randomization and threshold crypto
- **Byzantine Tolerance**: Tolerates \( f < n/3 \) malicious nodes (requires \( n \geq 3f + 1 \))

### **Epochs**
- Epochs aligned with day numbers: `epoch = current_day`
- Each epoch produces one finalized block of ordered events

### **Reliable Broadcast (RBC)**
- Conductor broadcasts VDF proof to all peers
- Proofs are erasure-coded and distributed as fragments
- Peers reconstruct proofs without trusting any single node

### **Threshold Encryption**
- Event batches encrypted with threshold encryption
- No single Conductor can decrypt; requires \( t \) out of \( n \) decryption shares
- Ensures privacy until consensus is reached

### **Common Coin**
- Randomness source for liveness (breaks ties)
- Derived from threshold BLS signature or external randomness (drand)

### **Quorum Certificates (QC)**
- Finalized blocks include a QC: aggregated signatures from 2/3+ Conductors
- QC proves that the block is committed and irreversible

### **Fork Choice Rule**
- Always follow the chain with 2/3+ supermajority
- Ignore forks with fewer supporters (Byzantine minority)

## ⚙️ **Difficulty Adjustment**

### **Goal**
- Maintain ~24-hour VDF computation time across the federation
- Adapt to changes in hardware (faster CPUs, more nodes, etc.)

### **Mechanism**
- Every 10 days, Conductor calculates median VDF completion time across all participants
- If median drifts from target (e.g., 20 hours or 28 hours), adjust difficulty:
  ```
  new_difficulty = current_difficulty * (target_time / median_time)
  ```
- Adjustment is smooth (exponential moving average) to avoid volatility

### **Protection Against Outliers**
- Single fast or slow node cannot skew adjustment (uses median, not mean)
- Outliers (e.g., ASIC users) are flagged and blacklisted before influencing adjustment

## 🚫 **Blacklist & Malicious Node Removal**

### **Detection Criteria**
- **VDF cheating**: Node completes proofs significantly faster than median (ASIC suspected)
- **Invalid proofs**: Node submits proofs that fail verification
- **Byzantine behavior**: Node submits conflicting data or votes
- **Replay attacks**: Node resubmits old proofs

### **Evidence Collection**
- Conductor monitors peer behavior and collects evidence (proof timestamps, invalid signatures, etc.)
- Evidence includes cryptographic proofs (cannot be forged)

### **BFT Vote**
1. Conductor submits evidence to peers
2. Peers review evidence and vote (approve/reject)
3. If 2/3+ vote to blacklist, node is added to blacklist
4. Blacklist update is signed with quorum certificate

### **Enforcement**
- Blacklisted nodes excluded from:
  - VDF consensus (proofs ignored)
  - Event ordering (batches rejected)
  - P2P network (disconnected by peers)
- Bridge instances relay blacklist to Stages (stop federating with bad actors)

### **Recovery**
- Blacklisted nodes can appeal via governance (2/3+ vote to unblock)
- Must provide evidence of corrected behavior

## 🧠 **Memory-Only Timestamp Validation**

### **Purpose**
- Detect ASIC cheating or clock drift (without leaking timestamps)
- Used for threat detection only (not consensus)

### **Mechanism**
- Each Conductor maintains a RAM-only clock (ephemeral, non-persistent)
- When VDF completes, Conductor checks: `true_day == computed_day`
- If mismatch (e.g., VDF finished too fast), flag as outlier

### **Privacy**
- Clock exists only in RAM; zeroed on restart
- Never persisted to disk or transmitted to peers
- Cannot be forensically recovered from seized nodes

## 📋 **Event Ordering & Commitment**

### **Event Batches**
- Bridge instances submit batches of federation events to Conductor
- Events include: posts, votes, registrations, moderation actions

### **Ordering**
- Events ordered deterministically within each day:
  - Primary: `creation_day` (day number)
  - Secondary: `order_index` (within-day sequence, assigned by Conductor)
- No timestamps used

### **Commitment**
- Conductor runs BFT consensus on event order
- Finalized blocks include:
  - Merkle root of events
  - Quorum certificate (2/3+ signatures)
- Blocks are immutable once finalized

### **Relay to Bridge**
- Conductor publishes finalized block to Bridge instances
- Bridge relays events to Stages
- Stages update local databases

## 🌐 **Network Participation**

### **Joining as a Conductor**
1. Deploy Conductor instance
2. Generate Ed25519 keypair
3. Submit join request to existing Conductors
4. Existing Conductors vote (2/3+ required)
5. If approved, new Conductor receives bootstrap data (recent blocks, VDF chain)

### **Bootstrap & Synchronization**
- New Conductor requests:
  - Historical VDF proofs (verify day chain)
  - Finalized blocks (reconstruct state)
  - Current blacklist
- Verification: Each day proof must chain to previous proof; all blocks must have valid QCs

## 🔌 **API Surface**

### **Bridge-to-Conductor API**

#### `POST /conductor/submit-batch`
- **Purpose**: Submit batch of events for ordering
- **Request**:
  ```json
  {
    "epoch": 1234,
    "events": [
      { "type": "PostAnnouncement", "hash": "hex" },
      { "type": "UserRegistration", "hash": "hex" }
    ]
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
    "merkle_root": "hex",
    "events": ["hex-1", "hex-2"],
    "quorum_cert": "hex"
  }
  ```

#### `GET /conductor/day-proof/{day}`
- **Purpose**: Retrieve canonical VDF proof for a day
- **Response**:
  ```json
  {
    "day_number": 1234,
    "vdf_proof": "hex",
    "difficulty": 86400000,
    "quorum_cert": "hex"
  }
  ```

### **Conductor-to-Conductor API (P2P)**

#### `SubmitVDFProof(day, proof, signature)`
- Submit VDF proof to peers for verification and consensus

#### `RequestVDFProof(day)`
- Request VDF proof from peer (for sync)

#### `VoteBlacklist(node_id, evidence)`
- Submit evidence and vote to blacklist a node

#### `RequestBlacklist()`
- Request current blacklist

## 📊 **Implementation Parameters**

| Parameter                | Value / Note                          |
|--------------------------|---------------------------------------|
| VDF Hash                 | BLAKE3                                |
| Iteration Target         | ~24 hours on reference hardware       |
| Proof Size               | ~1 KB (fast verification)             |
| Byzantine Tolerance      | \( f < n/3 \)                         |
| Finality Threshold       | 2/3+ nodes                            |
| Difficulty Adjustment    | Every 10 days                         |
| Checkpoint Interval      | Every 10 days                         |
| Max Proof Window         | Last 30 days (older pruned)           |
| Blacklist Consensus      | 2/3+ affirmative vote                 |

## 🛡️ **Privacy & Anonymity**

### **No Time Leakage**
- True day counter never exposed
- All external values are day numbers (no correlation with calendar dates)
- VDF proofs cannot be used to deduce wall-clock time

### **Event Privacy**
- Events transmitted as hashes (full content stays on originating Stage)
- Threshold encryption ensures no single Conductor sees event content before consensus

### **Forensic Resistance**
- RAM-only clock (zeroed on restart)
- No persistent timestamps anywhere in Conductor state
- Seized node reveals only day numbers and VDF proofs (no timing info)

## 📊 **Observability**

### **Metrics (Prometheus)**
- `conductor_vdf_duration_seconds`
- `conductor_day_number_current`
- `conductor_consensus_latency_seconds`
- `conductor_blacklist_size`
- `conductor_peer_count`

### **Logging**
- Structured JSON logs (no PII)
- Log: day advances, VDF completions, blacklist votes, consensus decisions
- Never log: timestamps, full event content

### **Health Endpoints**
- `GET /health/live`: Liveness probe
- `GET /health/ready`: Readiness probe (checks peer connectivity, VDF engine status)

## 🚀 **Deployment**

### **Docker Compose Example**
```yaml
version: "3.8"
services:
  conductor:
    image: chorus/conductor:latest
    ports: ["9090:9090", "4002:4002"]
    environment:
      - CONDUCTOR_ID=conductor-1
      - VDF_DIFFICULTY=86400000
      - CONSENSUS_THRESHOLD=0.67
    volumes:
      - ./keys:/app/keys
      - ./conductor.yaml:/app/conductor.yaml
      - conductor_data:/app/conductor_data

volumes:
  conductor_data:
```

### **Configuration (conductor.yaml)**
```yaml
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
    prometheus_port: 9090
    log_level: INFO
```

## 🧪 **Testing**

- Unit tests for VDF computation and verification
- Integration tests with mock Bridge instances
- Chaos tests: ASIC attackers, Byzantine nodes, network partitions
- Security audits: ensure no timing leaks

## 🔮 **Future Directions**

- **Hardware-Specific VDFs**: Custom VDF per node class (cloud vs. bare metal)
- **Zero-Knowledge Proofs**: Prove VDF completion without revealing intermediate state
- **Multi-Day Epochs**: Support epochs spanning multiple days for very large networks

---

**Document Status:** Component Documentation v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
