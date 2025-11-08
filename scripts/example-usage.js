const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * This script demonstrates the complete lifecycle of a Scope Creep Insurance agreement
 * Run with: npx hardhat run scripts/example-usage.js --network localhost
 */

async function main() {
  console.log("=== Scope Creep Insurance - Usage Example ===\n");

  // Get signers
  const [platformOwner, freelancer, client] = await ethers.getSigners();
  
  console.log("Accounts:");
  console.log("- Platform Owner:", platformOwner.address);
  console.log("- Freelancer:", freelancer.address);
  console.log("- Client:", client.address);
  console.log();

  // Deploy the contract
  console.log("Deploying ScopeCreepInsurance contract...");
  const ScopeCreepInsurance = await ethers.getContractFactory("ScopeCreepInsurance");
  const scopeCreepInsurance = await ScopeCreepInsurance.deploy();
  await scopeCreepInsurance.waitForDeployment();
  
  const contractAddress = await scopeCreepInsurance.getAddress();
  console.log("Contract deployed to:", contractAddress);
  console.log();

  // Example 1: Successful Agreement
  console.log("=== Example 1: Successful Agreement (No Scope Changes) ===\n");
  
  const projectAmount = ethers.parseEther("1.0");
  const projectScope = "Build a simple portfolio website with 3 pages: Home, About, Contact";
  
  console.log("1. Freelancer creates agreement:");
  console.log("   Amount:", ethers.formatEther(projectAmount), "ETH");
  console.log("   Scope:", projectScope);
  
  let tx = await scopeCreepInsurance.connect(freelancer).createAgreement(
    client.address,
    projectAmount,
    projectScope
  );
  await tx.wait();
  console.log("   ✓ Agreement #1 created\n");

  console.log("2. Client deposits funds:");
  tx = await scopeCreepInsurance.connect(client).depositFunds(1, {
    value: projectAmount
  });
  await tx.wait();
  console.log("   ✓ Funds deposited:", ethers.formatEther(projectAmount), "ETH\n");

  console.log("3. Work is completed successfully");
  const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);
  
  tx = await scopeCreepInsurance.connect(freelancer).completeAgreement(1);
  const receipt = await tx.wait();
  const gasUsed = receipt.gasUsed * receipt.gasPrice;
  
  const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);
  const payment = freelancerBalanceAfter - freelancerBalanceBefore + gasUsed;
  
  console.log("   ✓ Agreement completed");
  console.log("   Freelancer received:", ethers.formatEther(payment), "ETH");
  console.log("   Platform fee collected:", ethers.formatEther(await scopeCreepInsurance.totalFeesCollected()), "ETH");
  console.log();

  // Example 2: Agreement with One Scope Change
  console.log("=== Example 2: Agreement with One Scope Change ===\n");
  
  console.log("1. Create new agreement (1 ETH)");
  tx = await scopeCreepInsurance.connect(freelancer).createAgreement(
    client.address,
    projectAmount,
    "Build a landing page"
  );
  await tx.wait();
  console.log("   ✓ Agreement #2 created\n");

  console.log("2. Client deposits funds");
  tx = await scopeCreepInsurance.connect(client).depositFunds(2, {
    value: projectAmount
  });
  await tx.wait();
  console.log("   ✓ Funds deposited\n");

  console.log("3. Client requests scope change");
  const scopeChangeCharge = await scopeCreepInsurance.calculateScopeChangeCharge(2);
  console.log("   Additional charge:", ethers.formatEther(scopeChangeCharge), "ETH (20% of original)");
  
  tx = await scopeCreepInsurance.connect(client).requestScopeChange(2, {
    value: scopeChangeCharge
  });
  await tx.wait();
  console.log("   ✓ Scope change registered");
  
  const [atRisk, changes, remaining] = await scopeCreepInsurance.isClientAtRisk(2);
  console.log("   Client risk status: At risk:", atRisk, "| Changes:", changes.toString(), "| Remaining:", remaining.toString());
  console.log();

  console.log("4. Complete agreement");
  tx = await scopeCreepInsurance.connect(client).completeAgreement(2);
  await tx.wait();
  
  const agreement2 = await scopeCreepInsurance.getAgreement(2);
  console.log("   ✓ Agreement completed");
  console.log("   Total amount:", ethers.formatEther(agreement2.currentAmount), "ETH");
  console.log();

  // Example 3: Client Fired After 3 Scope Changes
  console.log("=== Example 3: Client Fired (3 Scope Changes) ===\n");
  
  console.log("1. Create new agreement (1 ETH)");
  tx = await scopeCreepInsurance.connect(freelancer).createAgreement(
    client.address,
    projectAmount,
    "Build a blog"
  );
  await tx.wait();
  console.log("   ✓ Agreement #3 created\n");

  console.log("2. Client deposits funds");
  tx = await scopeCreepInsurance.connect(client).depositFunds(3, {
    value: projectAmount
  });
  await tx.wait();
  console.log("   ✓ Funds deposited\n");

  console.log("3. Client makes excessive scope changes:");
  
  for (let i = 1; i <= 3; i++) {
    console.log(`   Scope change #${i}...`);
    tx = await scopeCreepInsurance.connect(client).requestScopeChange(3, {
      value: scopeChangeCharge
    });
    const changeReceipt = await tx.wait();
    
    // Check for alerts
    const alertEvent = changeReceipt.logs.find(
      log => {
        try {
          const parsed = scopeCreepInsurance.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed && parsed.name === 'ScopeChangeAlert';
        } catch {
          return false;
        }
      }
    );
    
    if (alertEvent) {
      const parsed = scopeCreepInsurance.interface.parseLog({
        topics: alertEvent.topics,
        data: alertEvent.data
      });
      console.log(`   ⚠️  ALERT: ${parsed.args.message}`);
    }
    
    // Check if client was fired
    const firedEvent = changeReceipt.logs.find(
      log => {
        try {
          const parsed = scopeCreepInsurance.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed && parsed.name === 'ClientFired';
        } catch {
          return false;
        }
      }
    );
    
    if (firedEvent) {
      const parsed = scopeCreepInsurance.interface.parseLog({
        topics: firedEvent.topics,
        data: firedEvent.data
      });
      console.log(`   🔥 CLIENT FIRED: ${parsed.args.reason}`);
    }
  }
  
  const agreement3 = await scopeCreepInsurance.getAgreement(3);
  console.log();
  console.log("   Final status: Client Fired");
  console.log("   Total paid by client:", ethers.formatEther(agreement3.currentAmount), "ETH");
  console.log("   Freelancer received full payment (minus 2.5% platform fee)");
  console.log();

  // Example 4: Manual Client Firing
  console.log("=== Example 4: Freelancer Manually Fires Client ===\n");
  
  console.log("1. Create new agreement (1 ETH)");
  tx = await scopeCreepInsurance.connect(freelancer).createAgreement(
    client.address,
    projectAmount,
    "Build an e-commerce site"
  );
  await tx.wait();
  console.log("   ✓ Agreement #4 created\n");

  console.log("2. Client deposits funds");
  tx = await scopeCreepInsurance.connect(client).depositFunds(4, {
    value: projectAmount
  });
  await tx.wait();
  console.log("   ✓ Funds deposited\n");

  console.log("3. Client makes one scope change");
  tx = await scopeCreepInsurance.connect(client).requestScopeChange(4, {
    value: scopeChangeCharge
  });
  await tx.wait();
  console.log("   ✓ Scope change registered\n");

  console.log("4. Freelancer decides to fire client");
  tx = await scopeCreepInsurance.connect(freelancer).fireClient(
    4,
    "Client making unreasonable demands and poor communication"
  );
  await tx.wait();
  console.log("   ✓ Client fired by freelancer");
  console.log("   Freelancer received payment for work done plus scope change fee");
  console.log();

  // Platform Stats
  console.log("=== Platform Statistics ===\n");
  const totalFees = await scopeCreepInsurance.totalFeesCollected();
  console.log("Total fees collected:", ethers.formatEther(totalFees), "ETH");
  console.log("Platform owner can withdraw fees at any time");
  console.log();

  console.log("=== Example Complete ===");
  console.log("\nKey Takeaways:");
  console.log("✓ Freelancers are protected from scope creep");
  console.log("✓ Clients can make changes but pay fairly for them");
  console.log("✓ Automatic enforcement keeps everyone accountable");
  console.log("✓ Platform earns 2.5% on all completed work");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
