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
  const nftContract = await hre.ethers.deployContract("SuperPionerosNFT");
  await nftContract.waitForDeployment();
  console.log("SuperPionerosNFT deployed to:", nftContract.target);
/*
  // Deploy the Fake Marketplace Contract
  const fakeNftMarketplaceContract = await hre.ethers.deployContract(
    "FakeNFTMarketplace"
  );
  await fakeNftMarketplaceContract.waitForDeployment();
  console.log(
    "FakeNFTMarketplace deployed to:",
    fakeNftMarketplaceContract.target
  );*/
  // Deploy the DAO Contract
  //const amount = hre.ethers.parseEther("0.01"); // You can change this value from 1 ETH to something else
  const daoContract = await hre.ethers.deployContract("SuperPionerosDAO", [
    // fakeNftMarketplaceContract.target,
    nftContract.target,
  ]);
  await daoContract.waitForDeployment();
  console.log("SuperPionerosDAO deployed to:", daoContract.target);

  /*
  const amount = hre.ethers.parseEther("0.01"); // You can change this value from 1 ETH to something else
  const daoContract = await hre.ethers.deployContract("SuperPionerosDAO", [
    "0x03A7af40b3d6d0A6f6763b148438910A36CbBC4A",
    "0x24501E00e5abea469C863bCde2E7f22f03fA0E71",
  ], { value: amount, });
  await daoContract.waitForDeployment();
  console.log("SuperPionerosDAO deployed to:", daoContract.target);*/

  // Sleep for 30 seconds to let Etherscan catch up with the deployments
  await sleep(30 * 1000);

  // Verify the NFT Contract
  await hre.run("verify:verify", {
    address: nftContract.target,
    constructorArguments: [],
  });
/*
  // Verify the Fake Marketplace Contract
  await hre.run("verify:verify", {
    address: fakeNftMarketplaceContract.target,
    constructorArguments: [],
  });
*/
  // Verify the DAO Contract
  await hre.run("verify:verify", {
    address: daoContract.target,
    constructorArguments: [
      // fakeNftMarketplaceContract.target,
      nftContract.target,
    ],
  });
}
 /* await hre.run("verify:verify", {
    address: daoContract.target,
    constructorArguments: [
      "0x03A7af40b3d6d0A6f6763b148438910A36CbBC4A",
      "0x24501E00e5abea469C863bCde2E7f22f03fA0E71",
    ],
  });
}*/

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*const hre = require("hardhat");

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = hre.ethers.parseEther("0.001");

  const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
    value: lockedAmount,
  });

  await lock.waitForDeployment();

  console.log(
    `Lock with ${ethers.formatEther(
      lockedAmount
    )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});*/
