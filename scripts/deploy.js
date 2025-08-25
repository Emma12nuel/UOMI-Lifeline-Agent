/* eslint-disable no-console */
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const net = await hre.ethers.provider.getNetwork();
  console.log("Network:", net.name || "custom", "chainId:", Number(net.chainId));

  // Defaults: 0.01 native UOMI drip, 1 hour cooldown, minBalance 0.5
  const drip = hre.ethers.parseEther("0.01");
  const cooldown = 3600;
  const minBalance = hre.ethers.parseEther("0.5");

  const Faucet = await hre.ethers.getContractFactory("UomiLifeline");
  const faucet = await Faucet.deploy(drip, cooldown, minBalance);
  await faucet.waitForDeployment();

  console.log("UomiLifeline deployed at:", faucet.target);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
