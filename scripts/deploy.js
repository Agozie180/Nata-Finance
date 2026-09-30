const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const NETWORKS = {
  5042: { key: "arc-mainnet", label: "Arc Mainnet", explorer: "https://explorer.arc.io" },
  5042002: { key: "arc-testnet", label: "Arc Testnet", explorer: "https://explorer.testnet.arc.io" }
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account. Set PRIVATE_KEY in .env before deploying.");
  }

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const meta = NETWORKS[chainId] || {
    key: `chain-${chainId}`,
    label: `Chain ${chainId}`,
    explorer: ""
  };

  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deploying NataFinance...");
  console.log("Network:", meta.label, `(chainId ${chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatUnits(balance, 18), "USDC");

  if (balance === 0n) {
    throw new Error("Deployer balance is 0. Fund the wallet with USDC (used for gas on Arc) before deploying.");
  }

  const NataFinance = await hre.ethers.getContractFactory("NataFinance");
  const nataFinance = await NataFinance.deploy();
  await nataFinance.waitForDeployment();

  const address = await nataFinance.getAddress();
  const deployTx = nataFinance.deploymentTransaction();

  const deployment = {
    contract: "NataFinance",
    address,
    network: meta.key,
    chainId,
    deployer: deployer.address,
    txHash: deployTx ? deployTx.hash : null,
    explorer: meta.explorer ? `${meta.explorer}/address/${address}` : "",
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, `${meta.key}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log("NataFinance deployed to:", address);
  if (deployment.explorer) console.log("Explorer:", deployment.explorer);
  console.log(`Saved deployment to deployments/${meta.key}.json`);
  console.log("");
  console.log(`Next step: set CONTRACT_ADDRESS in index.html to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
