const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("Deploying NataFinance...");
  console.log("Network:", network.name, Number(network.chainId));
  console.log("Deployer:", deployer.address);

  const NataFinance = await hre.ethers.getContractFactory("NataFinance");
  const nataFinance = await NataFinance.deploy();

  await nataFinance.waitForDeployment();

  const address = await nataFinance.getAddress();
  const deployment = {
    contract: "NataFinance",
    address,
    network: "arc-testnet",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    explorer: `https://testnet.arcscan.app/address/${address}`,
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, "arc-testnet.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("NataFinance deployed to:", address);
  console.log("ArcScan:", deployment.explorer);
  console.log("Saved deployment to deployments/arc-testnet.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
