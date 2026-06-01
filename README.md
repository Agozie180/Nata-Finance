# Nata Finance

Fast cross-border USDC payments for the NGN corridor on Arc testnet.

Nata Finance is a lightweight Web3 payment app that lets users send native USDC on Arc with Nigerian naira references and payment memos. It is designed for African freelancers, families, merchants, and small businesses that need clearer, cheaper, and faster cross-border settlement without a traditional bank wire flow.

## Problem

Cross-border payments for African users are often slow, expensive, and difficult to reconcile. The NGN-to-USDC corridor is especially important for people who earn, save, or settle invoices in dollars while still thinking about local obligations in naira. Nata Finance keeps the USDC transfer on-chain while preserving the NGN reference and memo that make the payment understandable later.

## Features

- 🚀 Native USDC payments on Arc testnet
- 💸 Automatic 0.5% protocol fee retained by the contract
- 🇳🇬 NGN reference field for local payment context
- 📝 Required memo with a 120-character limit
- 📚 Sent and received payment history
- 🔎 ArcScan links for confirmed transactions
- 🦊 MetaMask connection and one-click Arc testnet setup
- 📊 Live protocol stats for total payments, total volume, and contract balance

## How It Works

1. The sender connects MetaMask and switches to Arc testnet.
2. The sender enters a recipient address, USDC amount, NGN reference, and memo.
3. The frontend previews the 0.5% protocol fee and recipient net amount.
4. The sender confirms the transaction in MetaMask.
5. The contract forwards the net native USDC amount to the recipient.
6. The protocol fee remains in the contract for the owner to withdraw.
7. Both sender and recipient can view the payment in their history.

## Nata Finance in Brief

Nata Finance is a polished Web3 payment layer built for fast, secure native USDC settlement on Arc testnet. It combines blockchain-native transfers with local Nigerian payment context so users can move value across borders without losing the real-world meaning of every transaction.

### Market Snapshot

| Asset | Price (USD) |
| --- | --- |
| Bitcoin (BTC) | ![BTC Price](https://img.shields.io/coin/price/bitcoin/usd?style=flat-square) |
| Ethereum (ETH) | ![ETH Price](https://img.shields.io/coin/price/ethereum/usd?style=flat-square) |
| Solana (SOL) | ![SOL Price](https://img.shields.io/coin/price/solana/usd?style=flat-square) |
| USD Coin (USDC) | ![USDC Price](https://img.shields.io/coin/price/usd-coin/usd?style=flat-square) |
| Arbitrum (ARB) | ![ARB Price](https://img.shields.io/coin/price/arbitrum/usd?style=flat-square) |

## Frequently Asked Questions

### What can I do with Nata Finance?
Nata Finance lets you send native USDC on Arc testnet with a mandatory NGN reference and memo, giving every transfer a clear local payment context.

### Which network and token does it support?
It is built for Arc testnet and works with native USDC transfers using MetaMask.

### How is the protocol fee handled?
A transparent 0.5% fee is collected by the smart contract and can be withdrawn by the contract owner. The sender sees both gross and net amounts before confirming.

### Can recipients see their payment history?
Yes. Both senders and recipients can view their own payment history after connecting a wallet, with transaction details and ArcScan links.

### Do I need MetaMask?
Yes. MetaMask is used to connect the wallet, sign transactions, and switch to Arc testnet.

## Tech Stack

- Solidity 0.8.20
- Ethers.js v6
- Arc Testnet
- MetaMask
- Hardhat

## Getting Started

1. Clone the repository.

   ```bash
   git clone https://github.com/Agozie180/Nata-Finance.git
   cd Nata-Finance
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Create your environment file.

   ```bash
   cp .env.example .env
   ```

4. Add your deployer private key to `.env`.

5. Compile the contract.

   ```bash
   npm run compile
   ```

6. Deploy to Arc testnet.

   ```bash
   npm run deploy:arc
   ```

7. Copy the deployed address from `deployments/arc-testnet.json`.

8. Open `index.html` and replace `PASTE_YOUR_DEPLOYED_ADDRESS_HERE` with the deployed contract address.

9. Open `index.html` in your browser, connect MetaMask, switch to Arc testnet, and send a test payment.

## Deployed Contract

Contract address:

```text
PASTE_YOUR_DEPLOYED_ADDRESS_HERE
```

ArcScan:

```text
https://testnet.arcscan.app/address/PASTE_YOUR_DEPLOYED_ADDRESS_HERE
```

## Deployment Commands

Install Node.js dependencies:

```bash
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Open `.env` and add the private key for the wallet that will deploy the contract. Do not include `0x` unless your wallet export includes it and Hardhat accepts it.

Compile the Solidity contract:

```bash
npm run compile
```

Deploy to Arc testnet:

```bash
npm run deploy:arc
```

After deployment, open `deployments/arc-testnet.json`, copy the `address`, and paste it into `index.html` as `CONTRACT_ADDRESS`.

## Roadmap

- Payment requests
- ENS-style usernames
- Multi-currency support
- Mobile app
- DAO fee governance

## Footer

Developed by [Chiagozie50](https://x.com/chiagozie50) | Nata Finance © 2025
