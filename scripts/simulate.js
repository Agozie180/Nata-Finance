// End-to-end simulation of NataFinance on an in-process EVM (Osaka-compatible,
// matching Arc). Deploys the contract and exercises the real payment paths,
// with emphasis on the memo-optional fix. Run: npx hardhat run scripts/simulate.js
const hre = require("hardhat");
const { ethers } = hre;

function usdc(x) {
  return `${ethers.formatUnits(x, 18)} USDC`;
}

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();

  console.log("=== NataFinance simulation ===");
  console.log("Deployer/owner:", deployer.address);

  const NataFinance = await ethers.getContractFactory("NataFinance");
  const nata = await NataFinance.deploy();
  await nata.waitForDeployment();
  console.log("Deployed at:", await nata.getAddress());
  console.log("");

  // 1) Payment WITH a memo
  {
    const gross = ethers.parseUnits("100", 18);
    const expectedFee = gross / 200n;
    const expectedNet = gross - expectedFee;
    const bobBefore = await ethers.provider.getBalance(bob.address);

    const tx = await nata.connect(alice).sendPayment(bob.address, 137500n, "Invoice #108", { value: gross });
    await tx.wait();

    const bobAfter = await ethers.provider.getBalance(bob.address);
    const received = bobAfter - bobBefore;
    console.log("[1] Payment WITH memo (100 USDC)");
    console.log("    fee:", usdc(expectedFee), "| net to recipient:", usdc(expectedNet));
    console.log("    recipient actually received:", usdc(received));
    if (received !== expectedNet) throw new Error("net mismatch");
    console.log("    OK");
  }

  // 2) Payment WITHOUT a memo — the bug fix. Previously reverted with
  //    "NataFinance: memo is required"; must now succeed.
  {
    const gross = ethers.parseUnits("25", 18);
    const expectedNet = gross - gross / 200n;
    const bobBefore = await ethers.provider.getBalance(bob.address);

    const tx = await nata.connect(alice).sendPayment(bob.address, 34375n, "", { value: gross });
    const receipt = await tx.wait();

    const bobAfter = await ethers.provider.getBalance(bob.address);
    const received = bobAfter - bobBefore;
    console.log("[2] Payment WITHOUT memo (empty string) — the fix");
    console.log("    tx status:", receipt.status === 1 ? "success" : "FAILED");
    console.log("    recipient received:", usdc(received));
    if (receipt.status !== 1) throw new Error("empty-memo payment should succeed");
    if (received !== expectedNet) throw new Error("net mismatch on empty-memo payment");
    const sent = await nata.getSentPayments(alice.address);
    if (sent[sent.length - 1].memo !== "") throw new Error("stored memo should be empty");
    console.log("    OK — empty memo accepted and stored");
  }

  // 3) Guards still hold
  {
    console.log("[3] Guards");
    let reverted = false;
    try { await nata.connect(alice).sendPayment(bob.address, 1n, "x", { value: 0 }); }
    catch { reverted = true; }
    console.log("    zero amount reverts:", reverted);
    if (!reverted) throw new Error("zero amount should revert");

    reverted = false;
    try { await nata.connect(alice).sendPayment(alice.address, 1n, "x", { value: ethers.parseUnits("1", 18) }); }
    catch { reverted = true; }
    console.log("    send-to-self reverts:", reverted);
    if (!reverted) throw new Error("send-to-self should revert");

    reverted = false;
    try { await nata.connect(alice).sendPayment(bob.address, 1n, "z".repeat(121), { value: ethers.parseUnits("1", 18) }); }
    catch { reverted = true; }
    console.log("    memo > 120 chars reverts:", reverted);
    if (!reverted) throw new Error("over-long memo should revert");
    console.log("    OK");
  }

  // 4) Protocol totals + owner fee withdrawal
  {
    const totalPayments = await nata.totalPayments();
    const totalVolume = await nata.totalVolumeUSDC();
    const contractBal = await nata.contractBalance();
    console.log("[4] Protocol state");
    console.log("    totalPayments:", totalPayments.toString());
    console.log("    totalVolume:", totalVolume.toString(), "USDC");
    console.log("    contract fee balance:", usdc(contractBal));

    const ownerBefore = await ethers.provider.getBalance(deployer.address);
    const wtx = await nata.connect(deployer).withdrawFees(deployer.address);
    const wr = await wtx.wait();
    const gasCost = wr.gasUsed * wr.gasPrice;
    const ownerAfter = await ethers.provider.getBalance(deployer.address);
    const gained = ownerAfter - ownerBefore + gasCost;
    console.log("    owner withdrew (fees, gas-adjusted):", usdc(gained));
    if (gained !== contractBal) throw new Error("withdraw amount mismatch");
    if ((await nata.contractBalance()) !== 0n) throw new Error("contract balance should be 0 after withdraw");
    console.log("    OK");
  }

  console.log("");
  console.log("=== ALL SIMULATION CHECKS PASSED ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
