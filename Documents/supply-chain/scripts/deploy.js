const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  
  await supplyChain.deployed();
  console.log("SupplyChain deployed to:", supplyChain.address);
  
  // Save address for frontend
  const fs = require('fs');
  fs.writeFileSync(
    './contract-address.txt',
    supplyChain.address
  );
  console.log("Address saved to contract-address.txt");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });