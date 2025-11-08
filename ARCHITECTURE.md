# Scope Creep Insurance Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Scope Creep Insurance                      │
│                    Smart Contract                           │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │Freelancer│    │  Client  │    │ Platform │
  │          │    │          │    │  Owner   │
  └──────────┘    └──────────┘    └──────────┘
```

## Agreement Lifecycle

```
START
  │
  ▼
┌─────────────────────────────────────────┐
│ 1. Freelancer Creates Agreement         │
│    - Sets client address                │
│    - Defines scope                      │
│    - Sets amount                        │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│ 2. Client Deposits Funds                │
│    - Exact amount to escrow             │
│    - Funds held by contract             │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│ 3. Work Phase                           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Optional: Scope Changes             │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ Change #1: +20%, Alert sent   │   │ │
│ │ └───────────────────────────────┘   │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ Change #2: +20%, WARNING sent │   │ │
│ │ └───────────────────────────────┘   │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ Change #3: +20%, AUTO-FIRE    │   │ │
│ │ └───────────────────────────────┘   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│ 4. Agreement Resolution                 │
│                                         │
│ Path A: Completed Successfully          │
│ ├─ Freelancer paid (97.5%)             │
│ └─ Platform fee (2.5%)                 │
│                                         │
│ Path B: Client Auto-Fired (3 changes)  │
│ ├─ Freelancer paid full amount         │
│ └─ Platform fee deducted               │
│                                         │
│ Path C: Manual Fire (by freelancer)    │
│ ├─ Requires >= 1 scope change          │
│ ├─ Freelancer paid                     │
│ └─ Platform fee deducted               │
│                                         │
│ Path D: Cancelled                       │
│ └─ Only before funds deposited         │
└─────────────────────────────────────────┘
  │
  ▼
END
```

## Fee Structure

```
Original Project: 1 ETH
│
├─ No Scope Changes
│  └─ Total: 1 ETH
│     ├─ Freelancer: 0.975 ETH (97.5%)
│     └─ Platform: 0.025 ETH (2.5%)
│
├─ 1 Scope Change
│  └─ Total: 1.2 ETH (1 + 0.2)
│     ├─ Freelancer: 1.17 ETH (97.5%)
│     └─ Platform: 0.03 ETH (2.5%)
│
├─ 2 Scope Changes
│  └─ Total: 1.4 ETH (1 + 0.4)
│     ├─ Freelancer: 1.365 ETH (97.5%)
│     └─ Platform: 0.035 ETH (2.5%)
│
└─ 3 Scope Changes (AUTO-FIRE)
   └─ Total: 1.6 ETH (1 + 0.6)
      ├─ Freelancer: 1.56 ETH (97.5%)
      └─ Platform: 0.04 ETH (2.5%)
```

## State Machine

```
Agreement States:
┌───────────────┐
│     ACTIVE    │◄─── Initial State
└───────────────┘
        │
        ├────────────┬────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
┌───────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
│ COMPLETED │  │CLIENT_FIRED│  │CANCELLED │  │  ACTIVE  │
└───────────┘  └────────────┘  └──────────┘  └──────────┘
   (Final)        (Final)        (Final)     (Continue)
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────┐
│                    ScopeCreepInsurance                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │             Agreement Storage                   │    │
│  │  ┌────────────────────────────────────────┐    │    │
│  │  │ Agreement #1                           │    │    │
│  │  │ - Freelancer: 0x123...                 │    │    │
│  │  │ - Client: 0x456...                     │    │    │
│  │  │ - Amount: 1 ETH                        │    │    │
│  │  │ - Scope Changes: 2                     │    │    │
│  │  │ - Status: ACTIVE                       │    │    │
│  │  └────────────────────────────────────────┘    │    │
│  │  ┌────────────────────────────────────────┐    │    │
│  │  │ Agreement #2                           │    │    │
│  │  │ ...                                    │    │    │
│  │  └────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │             Core Functions                      │    │
│  │  • createAgreement()                           │    │
│  │  • depositFunds()                              │    │
│  │  • requestScopeChange()                        │    │
│  │  • fireClient()                                │    │
│  │  • completeAgreement()                         │    │
│  │  • cancelAgreement()                           │    │
│  │  • withdrawFees()                              │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │             Security Layer                      │    │
│  │  • Access Control Modifiers                    │    │
│  │  • Input Validation                            │    │
│  │  • Reentrancy Protection                       │    │
│  │  • Safe Math (Solidity 0.8+)                   │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Event Flow

```
User Action                Event Emitted              Data
─────────────────────────────────────────────────────────────
createAgreement()    ───► AgreementCreated      ───► ID, parties, amount, scope
depositFunds()       ───► FundsDeposited        ───► ID, amount
requestScopeChange() ───► ScopeChangeRequested  ───► ID, charge, count
                     ───► ScopeChangeAlert      ───► ID, message, count
fireClient()         ───► ClientFired           ───► ID, reason
                     ───► AgreementCompleted    ───► ID, payment, fee
completeAgreement()  ───► AgreementCompleted    ───► ID, payment, fee
cancelAgreement()    ───► AgreementCancelled    ───► ID, cancelled_by
withdrawFees()       ───► FeesWithdrawn         ───► owner, amount
```

## Access Control Matrix

```
Function              │ Freelancer │ Client │ Platform Owner │ Others
─────────────────────────────────────────────────────────────────────
createAgreement       │     ✓      │   ✗    │       ✗        │   ✗
depositFunds          │     ✗      │   ✓    │       ✗        │   ✗
requestScopeChange    │     ✗      │   ✓    │       ✗        │   ✗
fireClient            │     ✓      │   ✗    │       ✗        │   ✗
completeAgreement     │     ✓      │   ✓    │       ✗        │   ✗
cancelAgreement       │     ✓      │   ✓    │       ✗        │   ✗
withdrawFees          │     ✗      │   ✗    │       ✓        │   ✗
getAgreement          │     ✓      │   ✓    │       ✓        │   ✓
calculateCharge       │     ✓      │   ✓    │       ✓        │   ✓
isClientAtRisk        │     ✓      │   ✓    │       ✓        │   ✓
```

## Data Structures

```
Agreement {
  address freelancer         // Who does the work
  address client             // Who pays
  uint256 originalAmount     // Initial agreed price
  uint256 currentAmount      // With scope changes
  uint256 scopeChanges       // Count of modifications
  string originalScope       // Project description
  AgreementStatus status     // Current state
  uint256 createdAt          // Timestamp
  uint256 completedAt        // Timestamp (0 if active)
  bool fundsDeposited        // Safety check
}

Constants {
  PLATFORM_FEE_PERCENTAGE = 250     // 2.5%
  SCOPE_CHANGE_FEE_PERCENTAGE = 2000 // 20%
  MAX_SCOPE_CHANGES = 3              // Strike limit
  PERCENTAGE_BASE = 10000            // For calculations
}
```

## Security Features

```
┌─────────────────────────────────────────────┐
│         Security Measures                   │
├─────────────────────────────────────────────┤
│ ✓ Access Control Modifiers                 │
│   - onlyFreelancer                          │
│   - onlyClient                              │
│   - onlyPlatformOwner                       │
│   - agreementExists                         │
│   - agreementActive                         │
│                                             │
│ ✓ Checks-Effects-Interactions Pattern      │
│   - State changes before external calls     │
│                                             │
│ ✓ Input Validation                         │
│   - Non-zero addresses                      │
│   - Positive amounts                        │
│   - Non-empty strings                       │
│                                             │
│ ✓ Safe Math (Solidity 0.8+)                │
│   - Automatic overflow checks               │
│                                             │
│ ✓ Status Checks                            │
│   - Agreement must exist                    │
│   - Agreement must be active                │
│   - Funds must be deposited                 │
└─────────────────────────────────────────────┘
```

## Revenue Model

```
Platform Revenue Sources:
┌─────────────────────────────────────────┐
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Completed Agreements              │ │
│  │ ├─ Base projects: 2.5% fee       │ │
│  │ └─ With scope changes: 2.5% fee  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Fired Clients                     │ │
│  │ └─ All payments: 2.5% fee        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Revenue = (Total Payments × 2.5%)     │
│                                         │
│  Example with 100 ETH total volume:    │
│  Platform earns: 2.5 ETH               │
│  Freelancers earn: 97.5 ETH            │
└─────────────────────────────────────────┘
```

## Integration Points

```
Frontend/DApp
    │
    ├─► Web3 Provider (MetaMask, WalletConnect)
    │       │
    │       ├─► Contract Instance
    │       │       │
    │       │       ├─► Read Functions (free)
    │       │       │   └─ getAgreement()
    │       │       │   └─ isClientAtRisk()
    │       │       │   └─ calculateCharge()
    │       │       │
    │       │       └─► Write Functions (cost gas)
    │       │           └─ createAgreement()
    │       │           └─ depositFunds()
    │       │           └─ requestScopeChange()
    │       │           └─ completeAgreement()
    │       │
    │       └─► Event Listeners
    │           └─ Monitor agreement updates
    │           └─ Track scope changes
    │           └─ Alert on warnings
    │
    └─► Backend (optional)
        └─ Index events
        └─ Cache data
        └─ Send notifications
```
