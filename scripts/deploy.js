const hre = require("hardhat");

async function main() {
  console.log("Deploying ScopeCreepInsurance contract...");

  const ScopeCreepInsurance = await hre.ethers.getContractFactory("ScopeCreepInsurance");
  const scopeCreepInsurance = await ScopeCreepInsurance.deploy();

  await scopeCreepInsurance.waitForDeployment();

  const address = await scopeCreepInsurance.getAddress();
  console.log(`ScopeCreepInsurance deployed to: ${address}`);
  console.log(`Platform owner: ${await scopeCreepInsurance.platformOwner()}`);
  console.log(`Platform fee: ${await scopeCreepInsurance.PLATFORM_FEE_PERCENTAGE() / 100}%`);
  console.log(`Scope change fee: ${await scopeCreepInsurance.SCOPE_CHANGE_FEE_PERCENTAGE() / 100}%`);
  console.log(`Max scope changes: ${await scopeCreepInsurance.MAX_SCOPE_CHANGES()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
