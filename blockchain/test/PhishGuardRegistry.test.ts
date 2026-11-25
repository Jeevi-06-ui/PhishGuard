import { expect } from "chai";
import { ethers } from "hardhat";

describe("PhishGuardRegistry", function () {
  it("records a scan digest and verifies it by URL hash", async function () {
    const [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PhishGuardRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const urlHash = ethers.sha256(ethers.toUtf8Bytes("https://example.com/login"));
    const tx = await registry.recordScan(
      "scan-001",
      urlHash,
      "Phishing",
      88,
      "1.0.0"
    );
    await tx.wait();

    expect(await registry.getRecordCount()).to.equal(1n);

    const verification = await registry.verifyByUrlHash(urlHash);
    expect(verification.exists).to.equal(true);
    expect(verification.latestRecordId).to.equal(1n);
    expect(verification.riskScore).to.equal(88);
    expect(verification.prediction).to.equal("Phishing");
    expect(verification.modelVersion).to.equal("1.0.0");

    const record = await registry.getRecord(0);
    expect(record.recordedBy).to.equal(deployer.address);
    expect(record.scanId).to.equal("scan-001");
  });

  it("rejects out-of-range risk scores and zero hashes", async function () {
    const Factory = await ethers.getContractFactory("PhishGuardRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    await expect(
      registry.recordScan("scan-002", ethers.ZeroHash, "Legitimate", 10, "1.0.0")
    ).to.be.revertedWith("urlHash cannot be zero");

    const validHash = ethers.sha256(ethers.toUtf8Bytes("https://portal.edu"));
    await expect(
      registry.recordScan("scan-003", validHash, "Legitimate", 101, "1.0.0")
    ).to.be.revertedWith("riskScore must be <= 100");
  });
});
