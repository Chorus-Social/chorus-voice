# Chorus Network Documentation

**Version:** 2.0  
**Date:** January 27, 2025  
**Status:** Comprehensive Documentation Suite

---

## Overview

This documentation suite provides complete coverage of the **Chorus Network**, a decentralized, privacy-first social platform built on four foundational layers: **Clients**, **Stage**, **Bridge**, and **Conductor**. Each component is designed around a core pillar: **anonymity**. Every architectural decision, data model, and protocol is evaluated through the lens of user privacy.

## 🏗️ **System Architecture**

The Chorus Network operates as a four-layer architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 1: Clients                           │
│  (Web, Mobile, Desktop, Third-Party — Official & Community)     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ REST API / WebSocket
                            │ (HTTPS, JWT Authentication)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Layer 2: Chorus Stage                       │
│            (FastAPI, PostgreSQL, Privacy Enforcement)           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Bridge Integration API
                            │ (REST/gRPC, mTLS, Signed Requests)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Layer 3: Chorus Bridge                      │
│       (Replication & Federation Layer, P2P Mesh, Gossipsub)     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Consensus Integration
                            │ (gRPC, Threshold Encryption, BFT)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Layer 4: Conductor                          │
│   (Leaderless ABFT Consensus, VDF-Proven Day Counter, Warden)  │
└─────────────────────────────────────────────────────────────────┘
```

## 📚 **Documentation Structure**

### **Core Components**
- **[Chorus Stage](./Chorus-Stage.md)** - User-facing API server and data custodian
- **[Chorus Bridge](./Chorus-Bridge.md)** - Federation and replication layer
- **[Chorus Conductor](./Chorus-Conductor.md)** - Consensus engine and network warden
- **[Chorus Clients](./Chorus-Clients.md)** - Client applications and interfaces

### **System Integration**
- **[Architecture Overview](./Architecture-Overview.md)** - Complete system architecture
- **[Data Flow](./Data-Flow.md)** - How data moves through the system
- **[Security Model](./Security-Model.md)** - Privacy and security guarantees
- **[Consensus Protocol](./Consensus-Protocol.md)** - VDF-based consensus without timestamps

### **Development & Operations**
- **[Development Setup](./Development-Setup.md)** - Local development environment
- **[Deployment Guide](./Deployment-Guide.md)** - Production deployment
- **[API Reference](./API-Reference.md)** - Complete API documentation
- **[Configuration Guide](./Configuration-Guide.md)** - System configuration

### **Advanced Topics**
- **[VDF System](./VDF-System.md)** - Verifiable Delay Functions and day counter
- **[Federation Protocol](./Federation-Protocol.md)** - Inter-instance communication
- **[Privacy Guarantees](./Privacy-Guarantees.md)** - Anonymity and data protection
- **[Byzantine Fault Tolerance](./Byzantine-Fault-Tolerance.md)** - BFT consensus and blacklisting

### **Operations & Monitoring**
- **[Operations Guide](./Operations-Guide.md)** - Day-to-day operations
- **[Monitoring Guide](./Monitoring-Guide.md)** - Observability and metrics
- **[Troubleshooting Guide](./Troubleshooting-Guide.md)** - Common issues and solutions
- **[Performance Guide](./Performance-Guide.md)** - Optimization and tuning

## 🚀 **Quick Start**

### **For Developers**
1. Read [Architecture Overview](./Architecture-Overview.md) to understand the system
2. Follow [Development Setup](./Development-Setup.md) to set up your environment
3. Review [API Reference](./API-Reference.md) for implementation details
4. Check [Security Model](./Security-Model.md) for privacy considerations

### **For Operators**
1. Start with [Deployment Guide](./Deployment-Guide.md) for production setup
2. Review [Configuration Guide](./Configuration-Guide.md) for system configuration
3. Set up [Monitoring Guide](./Monitoring-Guide.md) for observability
4. Read [Operations Guide](./Operations-Guide.md) for day-to-day management

### **For Integrators**
1. Understand [Federation Protocol](./Federation-Protocol.md) for network communication
2. Review [Consensus Protocol](./Consensus-Protocol.md) for consensus mechanisms
3. Check [Privacy Guarantees](./Privacy-Guarantees.md) for anonymity requirements
4. Read [VDF System](./VDF-System.md) for time-agnostic consensus

## 🔑 **Key Innovations**

### **Time-Agnostic Consensus**
- **First-of-its-kind**: BFT consensus without wall-clock time
- Uses VDF-proven day counter to maintain temporal ordering without timestamps
- Protects against temporal correlation attacks

### **Privacy-First Federation**
- Only transmits day numbers, order IDs, and content hashes
- Full content stays on originating Stage; peers request only what they need
- No PII or metadata leakage across federation boundaries

### **Open & Extensible**
- Welcomes third-party clients with no approval process
- API is open, documented, and versioned
- Encourages innovation while maintaining privacy guarantees

## 🛡️ **Core Pillar: Anonymity**

Every feature and decision in Chorus is evaluated through the lens of **anonymity**:

- **No Real-World Timestamps**: Never stored, never transmitted, never exposed
- **Data Minimization**: If data is not essential for functionality, do not store it
- **Cryptographic Anonymity**: Users identified by `pubkey_hash`, never by usernames or emails
- **Time-Agnostic Consensus**: Conductor never uses wall-clock time for consensus decisions

## 📊 **Performance Targets**

| Metric                          | Target                  |
|---------------------------------|-------------------------|
| Client → Stage Latency          | <100ms (LAN/CDN)        |
| Stage → Bridge Latency          | <50ms (local)           |
| Federation Propagation Time     | <5 seconds (network-wide) |
| VDF Day Advancement             | ~24 hours (reference HW) |
| Consensus Finality              | 2-3 seconds (BFT)       |
| Database Read Latency           | <10ms (PostgreSQL)      |
| WebSocket Event Delivery        | <100ms (real-time)      |

## 🔒 **Security & Privacy**

- **Byzantine Fault Tolerance**: Tolerates up to f < n/3 malicious nodes
- **VDF-Based Time**: Cryptographically proven time progression without timestamps
- **End-to-End Encryption**: Direct messages encrypted client-side
- **No Metadata Leakage**: Only day numbers and order IDs transmitted
- **Blacklist Enforcement**: BFT-voted removal of malicious nodes

## 📈 **Production Ready**

- **Zero Linting Errors**: All code passes quality checks
- **Comprehensive Testing**: Unit, integration, and performance tests
- **Security Hardened**: Multi-layer security with best practices
- **Production Deployed**: Docker, Kubernetes, and monitoring ready

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./Contributing-Guide.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### **Repository Links**
- **[Chorus Stage](https://github.com/Chorus-Social/chorus-stage)** - User-facing API server
- **[Chorus Bridge](https://github.com/Chorus-Social/chorus-bridge)** - Federation and replication layer
- **[Chorus Conductor](https://github.com/Chorus-Social/conductor)** - Consensus engine
- **[Chorus Social](https://github.com/Chorus-Social)** - Organization home page

## 📄 **Licensing**

All Chorus components: **GPLv3**

## 🆘 **Support**

- **Documentation**: This comprehensive documentation suite
- **Issues**: [GitHub Issues](https://github.com/Chorus-Social/chorus-stage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Chorus-Social/chorus-stage/discussions)
- **Email**: documentation@chorus-social.net

---

**Chorus Network** - The privacy-first, decentralized social platform that achieves Byzantine fault tolerance, high-speed replication, and uncompromising anonymity through innovative VDF-based consensus and time-agnostic architecture.

---

**Document Status:** Comprehensive Documentation Suite v2.0  
**Authors:** Hailey ❤️  
**Contact:** documentation@chorus-social.net
