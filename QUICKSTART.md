# Quick Start Guide

This guide will help you get started with Scope Creep Insurance quickly.

## Prerequisites

- Node.js (v12 or higher)
- npm or yarn
- MetaMask or another Web3 wallet

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jmenichole/Scope-Creep.git
cd Scope-Creep
```

2. Install dependencies:
```bash
npm install
```

3. Compile the smart contract:
```bash
npm run compile
```

## Local Testing

### Start a Local Blockchain

In one terminal, start a local Hardhat node:

```bash
npm run node
```

This will start a local blockchain and display test accounts with private keys.

### Run the Example

In another terminal, run the usage example:

```bash
npm run example
```

This will demonstrate:
- Creating agreements
- Depositing funds
- Requesting scope changes
- Automatic client firing
- Manual client firing
- Fee collection

### Run Tests

```bash
npm test
```

## Basic Usage

### 1. Deploy the Contract

```bash
npm run deploy
```

### 2. Create an Agreement (Freelancer)

```javascript
const ScopeCreepInsurance = await ethers.getContractAt(
  "ScopeCreepInsurance",
  contractAddress
);

const tx = await ScopeCreepInsurance.createAgreement(
  clientAddress,
  ethers.parseEther("1.0"), // 1 ETH
  "Build a website with 3 pages"
);
const receipt = await tx.wait();
console.log("Agreement created:", receipt);
```

### 3. Deposit Funds (Client)

```javascript
await ScopeCreepInsurance.connect(client).depositFunds(agreementId, {
  value: ethers.parseEther("1.0")
});
```

### 4. Request Scope Change (Client)

```javascript
const charge = await ScopeCreepInsurance.calculateScopeChangeCharge(agreementId);
await ScopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
  value: charge
});
```

### 5. Complete Agreement

```javascript
await ScopeCreepInsurance.connect(freelancer).completeAgreement(agreementId);
```

## Important Numbers

- **Platform Fee**: 2.5% of total payment
- **Scope Change Fee**: 20% of original amount
- **Max Scope Changes**: 3 (then automatic firing)

## What Happens When?

### Client Makes 1st Scope Change
- Pays 20% additional
- Gets a notification
- Can continue with 2 more changes

### Client Makes 2nd Scope Change
- Pays another 20%
- Gets a **WARNING**
- Only 1 more change allowed

### Client Makes 3rd Scope Change
- Pays another 20%
- **AUTOMATICALLY FIRED**
- Freelancer receives full payment
- Agreement is completed

## Common Questions

### Can I cancel an agreement?
Yes, but only before the client deposits funds.

### Can a freelancer fire a client before 3 scope changes?
Yes, as long as the client has made at least 1 scope change.

### What if the client never deposits funds?
Either party can cancel the agreement if funds haven't been deposited.

### How do I check the status of an agreement?
```javascript
const agreement = await ScopeCreepInsurance.getAgreement(agreementId);
console.log("Status:", agreement.status);
// 0 = Active, 1 = Completed, 2 = ClientFired, 3 = Cancelled
```

### How do I check if the client is at risk?
```javascript
const [atRisk, changes, remaining] = await ScopeCreepInsurance.isClientAtRisk(agreementId);
console.log(`At Risk: ${atRisk}, Changes: ${changes}, Remaining: ${remaining}`);
```

## Next Steps

- Read the full [DOCUMENTATION.md](./DOCUMENTATION.md)
- Review the [contract source code](./contracts/ScopeCreepInsurance.sol)
- Check out the [tests](./test/ScopeCreepInsurance.test.js)
- Run the [example script](./scripts/example-usage.js)

## Support

For issues or questions:
- Open an issue on GitHub
- Review the documentation
- Check the test files for usage examples

## Security Note

Always test on a testnet before deploying to mainnet. Never share your private keys.
