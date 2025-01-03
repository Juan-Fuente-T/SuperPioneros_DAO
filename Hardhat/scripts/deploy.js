// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

//COMANDO DEPLOY: npx hardhat run scripts/deploy.js --network sepolia

const hre = require("hardhat");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {

  // Deploy the NFT Contract
  const nftContract = await hre.ethers.deployContract("SuperPionerosNFT", []);
  await nftContract.waitForDeployment();
  console.log("SuperPionerosNFT deployed to:", nftContract.target);
  
  // Deploy the DAO Contract
  const daoContract = await hre.ethers.deployContract("SuperPionerosDAO", [
    nftContract.target,
  ]);
  await daoContract.waitForDeployment();
  console.log("SuperPionerosDAO deployed to:", daoContract.target);


  // Sleep for 30 seconds to let Etherscan catch up with the deployments
  await sleep(30 * 1000);

  // Verify the NFT Contract
  await hre.run("verify:verify", {
    address: nftContract.target,
    constructorArguments: [],
  });

  // Verify the DAO Contract
  await hre.run("verify:verify", {
    address: daoContract.target,
    constructorArguments: [
      nftContract.target,
    ],
  });
}

// Pattern to use async/await and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
