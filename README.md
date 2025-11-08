# Scope Creep Insurance

Smart contract tool that locks down freelance agreements with anti-scope-creep enforcement. If the client starts to add more nonsense to the job, the system alerts, charges more, or even fires the client.

## 🎯 Features

- **Escrow-Based Payments**: Secure fund management with smart contract escrow
- **Automatic Scope Change Detection**: Tracks and charges for scope modifications
- **Progressive Penalties**: 20% additional charge per scope change
- **Three-Strike System**: Automatically fires clients after 3 scope changes
- **Alert System**: Warns clients before reaching the firing threshold
- **Revenue Model**: 2.5% platform fee on all completed agreements

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

## 📖 How It Works

### For Freelancers

1. Create an agreement with client address, amount, and scope
2. Client deposits funds into escrow
3. Work on the project
4. Monitor scope change requests (optional)
5. Complete the agreement or fire the client if needed
6. Receive payment automatically (97.5% after platform fee)

### For Clients

1. Review and accept the agreement
2. Deposit project funds into escrow
3. Request scope changes if needed (⚠️ costs 20% each)
4. Be mindful: 3 scope changes = automatic firing
5. Complete the agreement when satisfied

### Anti-Scope-Creep Protection

- **1st scope change**: +20% charge, alert sent
- **2nd scope change**: +20% charge, warning sent
- **3rd scope change**: +20% charge, **client is automatically fired**
- Freelancer gets paid in full including all scope change fees (minus 2.5% platform fee)

## 💰 Economic Model

### Platform Revenue
- 2.5% fee on all completed agreements
- No subscription costs for users
- Revenue scales with usage

### Example Calculation

Original project: 1 ETH
- Client makes 2 scope changes: +0.4 ETH
- Total: 1.4 ETH
- Platform fee: 0.035 ETH (2.5%)
- Freelancer receives: 1.365 ETH

## 📊 Contract Details

- **Platform Fee**: 2.5%
- **Scope Change Fee**: 20% of original amount
- **Max Scope Changes**: 3 (then automatic firing)
- **Solidity Version**: 0.8.20

## 🛠️ Tech Stack

- Solidity ^0.8.20
- Hardhat
- Ethers.js
- Mocha & Chai (testing)

## 📚 Documentation

For detailed documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)

Topics covered:
- Complete usage guide for freelancers, clients, and platform owners
- Contract architecture
- All functions and events
- Security considerations
- Example scenarios
- Deployment guide

## 🧪 Testing

The project includes a comprehensive test suite covering:
- Agreement creation and validation
- Fund deposits
- Scope change mechanisms
- Alert system
- Client firing (automatic and manual)
- Payment distribution
- Fee collection

## 🎯 Target Market

**Niche**: Freelancers who've had enough of endless scope creep

Perfect for:
- Web developers
- Graphic designers
- Content writers
- Consultants
- Any freelancer dealing with demanding clients

## 🔒 Security

- Access control on all sensitive functions
- Reentrancy protection
- Input validation
- Solidity 0.8+ overflow protection
- Comprehensive test coverage

## 📝 License

MIT

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⚠️ Disclaimer

This is a smart contract for managing freelance agreements. Use at your own risk. Always test thoroughly on testnets before mainnet deployment.

