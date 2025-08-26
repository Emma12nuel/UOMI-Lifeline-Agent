# 🤝 UOMI Lifeline Faucet Agent

Native **UOMI** faucet contract for the **UOMI testnet**. It delivers fair drips with cooldowns, accepts donations, and includes basic admin controls (pause + ownership transfer). Built for the Finney testnet (chainId **4386**).

> **Note:** This faucet distributes the **native UOMI coin** (not an ERC-20).

## Features
- ⏱️ **Cooldown per user** (prevents abuse)
- 👤 **EOA-only** claim gate (simple anti-bot; optional)
- 💧 **Adaptive drip** (halves when balance below threshold)
- 🙌 **Donations** supported
- 🛠️ **Admin ops**: pause/unpause, update config, transfer ownership
- 🧪 **Robust tests** (ethers v6 + hardhat-toolbox matchers)

---

## Stack
- Solidity `^0.8.20`
- Hardhat `^2.20.1`
- Ethers v6 (via `@nomicfoundation/hardhat-toolbox`)

---

## UOMI Network
- **RPC**: `https://finney.uomi.ai`
- **Chain ID**: `4386`

---

## Setup

```bash
npm install
cp .env.example .env
# edit .env to add your PRIVATE_KEY
