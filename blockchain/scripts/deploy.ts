import fs from "node:fs";
import path from "node:path";
import { artifacts, ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("PhishGuardRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const chainNetwork = await ethers.provider.getNetwork();
  const artifact = await artifacts.readArtifact("PhishGuardRegistry");

  const deploymentPayload = {
    contractName: "PhishGuardRegistry",
    address,
    chainId: Number(chainNetwork.chainId),
    networkName: network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const deploymentsDir = path.resolve(__dirname, "../deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const latestPath = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(deploymentPayload, null, 2));

  // Mirror contract artifact to backend/app/contracts for seamless FastAPI loading
  const backendContractsDir = path.resolve(__dirname, "../../backend/app/contracts");
  fs.mkdirSync(backendContractsDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendContractsDir, "PhishGuardRegistry.json"),
    JSON.stringify({ abi: artifact.abi, address, chainId: Number(chainNetwork.chainId) }, null, 2)
  );

  console.log(`PhishGuardRegistry deployed to ${address} on chainId=${chainNetwork.chainId}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
