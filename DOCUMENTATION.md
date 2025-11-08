# Scope Creep Insurance - Documentation

## Overview

Scope Creep Insurance is a smart contract tool that locks down freelance agreements with anti-scope-creep enforcement. If the client starts to add more work to the job, the system alerts, charges more, or even fires the client.

### Features

- **Escrow-based Payments**: Secure fund management with client deposits
- **Automatic Scope Change Detection**: Tracks all scope modifications
- **Progressive Penalties**: 20% additional charge per scope change
- **Alert System**: Warns clients before reaching the firing threshold
- **Automatic Client Firing**: After 3 scope changes, client is automatically fired and freelancer is paid
- **Platform Fee Model**: 2.5% platform cut on all completed agreements
- **Transparent Operations**: All actions are recorded on-chain with events

## Contract Architecture

### Core Components

1. **Agreement Structure**
   - Freelancer and client addresses
   - Original and current project amounts
   - Scope change tracking
   - Agreement status (Active, Completed, ClientFired, Cancelled)
   - Original scope description

2. **Fee Structure**
   - Platform Fee: 2.5% of total payment
   - Scope Change Fee: 20% of original amount per change
   - Maximum Scope Changes: 3 (then automatic firing)

### Agreement Lifecycle

```
1. Create Agreement (Freelancer)
   ↓
2. Deposit Funds (Client)
   ↓
3. Work Phase
   - Optional: Request Scope Changes (Client)
   - Automatic alerts on scope changes
   - Automatic firing after 3 changes
   ↓
4. Complete Agreement (Either party)
   OR Fire Client (Freelancer)
   OR Cancel (Either party, only before funds deposited)
   ↓
5. Funds Released
```

## Usage Guide

### For Freelancers

#### 1. Create an Agreement

```javascript
const tx = await scopeCreepInsurance.createAgreement(
  clientAddress,
  ethers.parseEther("1.0"), // Project amount
  "Build a simple website with 3 pages and contact form"
);
const receipt = await tx.wait();
// Get agreement ID from the AgreementCreated event
```

#### 2. Wait for Client to Deposit Funds

The client must deposit the exact project amount into escrow.

#### 3. Monitor Scope Changes

Listen for `ScopeChangeRequested` and `ScopeChangeAlert` events to track client behavior.

```javascript
scopeCreepInsurance.on("ScopeChangeAlert", (agreementId, message, scopeChangeCount) => {
  console.log(`Agreement ${agreementId}: ${message} (${scopeChangeCount} changes)`);
});
```

#### 4. Fire Client (if needed)

If the client becomes too demanding, you can manually fire them:

```javascript
await scopeCreepInsurance.fireClient(agreementId, "Client making unreasonable demands");
```

Note: Client must have made at least one scope change to be fired manually.

#### 5. Complete Agreement

When work is done:

```javascript
await scopeCreepInsurance.completeAgreement(agreementId);
```

Funds will be automatically released minus the 2.5% platform fee.

### For Clients

#### 1. Review Agreement

Check the agreement details:

```javascript
const agreement = await scopeCreepInsurance.getAgreement(agreementId);
console.log("Original Amount:", ethers.formatEther(agreement.originalAmount));
console.log("Scope:", agreement.originalScope);
```

#### 2. Deposit Funds

Deposit the exact project amount:

```javascript
await scopeCreepInsurance.depositFunds(agreementId, {
  value: projectAmount
});
```

#### 3. Request Scope Changes (Carefully!)

Each scope change costs 20% of the original amount:

```javascript
const additionalCharge = await scopeCreepInsurance.calculateScopeChangeCharge(agreementId);
await scopeCreepInsurance.requestScopeChange(agreementId, {
  value: additionalCharge
});
```

**Warning**: After 3 scope changes, you will be automatically fired and the freelancer will be paid in full.

#### 4. Check Risk Status

Monitor your scope change count:

```javascript
const [atRisk, changeCount, remaining] = await scopeCreepInsurance.isClientAtRisk(agreementId);
console.log(`At risk: ${atRisk}, Changes made: ${changeCount}, Remaining: ${remaining}`);
```

#### 5. Complete Agreement

When satisfied with the work:

```javascript
await scopeCreepInsurance.completeAgreement(agreementId);
```

### For Platform Owners

#### Withdraw Collected Fees

```javascript
const feesCollected = await scopeCreepInsurance.totalFeesCollected();
console.log("Fees available:", ethers.formatEther(feesCollected));

await scopeCreepInsurance.withdrawFees();
```

## Events

The contract emits the following events:

- `AgreementCreated`: New agreement created
- `FundsDeposited`: Client deposited funds
- `ScopeChangeRequested`: Client requested a scope change
- `ScopeChangeAlert`: Warning about scope creep
- `ClientFired`: Client fired for excessive scope creep
- `AgreementCompleted`: Agreement successfully completed
- `AgreementCancelled`: Agreement cancelled
- `FeesWithdrawn`: Platform fees withdrawn

## Smart Contract Functions

### Public Functions

#### `createAgreement(address client, uint256 amount, string scope)`
Create a new freelance agreement.

#### `depositFunds(uint256 agreementId)`
Client deposits funds into escrow (payable).

#### `requestScopeChange(uint256 agreementId)`
Client requests a scope change with 20% additional payment (payable).

#### `fireClient(uint256 agreementId, string reason)`
Freelancer fires client for scope creep.

#### `completeAgreement(uint256 agreementId)`
Mark agreement as completed and release funds.

#### `cancelAgreement(uint256 agreementId)`
Cancel agreement (only if funds not deposited).

#### `withdrawFees()`
Platform owner withdraws collected fees.

### View Functions

#### `getAgreement(uint256 agreementId)`
Get full agreement details.

#### `calculateScopeChangeCharge(uint256 agreementId)`
Calculate the cost of a scope change.

#### `isClientAtRisk(uint256 agreementId)`
Check if client is close to being fired.

## Economic Model

### Revenue for Platform

The platform earns 2.5% of all completed payments. For example:

- Project: 1 ETH
- With 2 scope changes: 1 ETH + 0.2 ETH + 0.2 ETH = 1.4 ETH total
- Platform fee: 1.4 ETH × 2.5% = 0.035 ETH
- Freelancer receives: 1.365 ETH

### Benefits for Freelancers

1. **Protection from scope creep**: Automatic charges discourage endless revisions
2. **Fair compensation**: Get paid more for additional work
3. **Exit option**: Fire unreasonable clients and still get paid
4. **Secure payments**: Funds held in escrow

### Benefits for Clients

1. **Transparent costs**: Know exactly what additional changes cost
2. **Fair system**: Can request changes but with clear limits
3. **Escrow security**: Funds only released when work is complete

## Security Considerations

1. **Access Control**: Only authorized parties can perform specific actions
2. **Reentrancy Protection**: Uses proper checks-effects-interactions pattern
3. **Integer Overflow**: Protected by Solidity 0.8+ built-in checks
4. **Input Validation**: All inputs are validated before processing

## Example Scenarios

### Scenario 1: Happy Path

1. Freelancer creates agreement: 1 ETH for "Build a website"
2. Client deposits 1 ETH
3. Work progresses smoothly
4. Freelancer completes agreement
5. Freelancer receives 0.975 ETH (97.5%)
6. Platform receives 0.025 ETH (2.5%)

### Scenario 2: One Scope Change

1. Agreement created: 1 ETH
2. Client deposits 1 ETH
3. Client requests scope change, pays 0.2 ETH
4. Current amount: 1.2 ETH
5. Agreement completed
6. Freelancer receives 1.17 ETH
7. Platform receives 0.03 ETH

### Scenario 3: Client Fired

1. Agreement created: 1 ETH
2. Client deposits 1 ETH
3. Client makes 3 scope changes (pays 0.6 ETH total)
4. **Automatic**: Client is fired
5. Freelancer receives 1.56 ETH (97.5% of 1.6 ETH)
6. Platform receives 0.04 ETH

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite covers:
- Agreement creation and validation
- Funds deposit mechanism
- Scope change tracking
- Alert system
- Automatic client firing
- Manual client firing
- Agreement completion
- Fee withdrawal
- Edge cases and error conditions

## Deployment

### Local Deployment

```bash
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet Deployment

Configure your network in `hardhat.config.js` and run:

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses `uint256` for all numbers (native word size)
- Minimal storage writes
- Efficient event emission
- No unnecessary loops

## Future Enhancements

Potential features for future versions:
1. Milestone-based payments
2. Dispute resolution mechanism
3. Multi-signature requirements
4. Time-locked agreements
5. Reputation system
6. NFT-based agreement certificates

## License

MIT License

## Support

For issues, questions, or contributions, please refer to the project repository.
