const fs = require('fs');
const solc = require('solc');
const path = require('path');

// Read the Solidity source code
const contractPath = path.resolve(__dirname, 'contracts', 'ScopeCreepInsurance.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Prepare input for the compiler
const input = {
  language: 'Solidity',
  sources: {
    'ScopeCreepInsurance.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
};

// Compile the contract
console.log('Compiling ScopeCreepInsurance.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
  let hasErrors = false;
  output.errors.forEach(error => {
    if (error.severity === 'error') {
      console.error('Error:', error.formattedMessage);
      hasErrors = true;
    } else {
      console.warn('Warning:', error.formattedMessage);
    }
  });
  if (hasErrors) {
    process.exit(1);
  }
}

// Create artifacts directory
const artifactsDir = path.resolve(__dirname, 'artifacts', 'contracts', 'ScopeCreepInsurance.sol');
fs.mkdirSync(artifactsDir, { recursive: true });

// Save the compiled contract
const contract = output.contracts['ScopeCreepInsurance.sol']['ScopeCreepInsurance'];
const artifact = {
  contractName: 'ScopeCreepInsurance',
  abi: contract.abi,
  bytecode: '0x' + contract.evm.bytecode.object,
  deployedBytecode: '0x' + contract.evm.deployedBytecode.object
};

fs.writeFileSync(
  path.join(artifactsDir, 'ScopeCreepInsurance.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('✓ Compilation successful!');
console.log('Artifact saved to:', path.join(artifactsDir, 'ScopeCreepInsurance.json'));
