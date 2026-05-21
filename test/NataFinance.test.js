const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("NataFinance", function () {
  async function deployFixture() {
    const [owner, sender, recipient, other] = await ethers.getSigners();
    const NataFinance = await ethers.getContractFactory("NataFinance");
    const nataFinance = await NataFinance.deploy();
    await nataFinance.waitForDeployment();

    return { nataFinance, owner, sender, recipient, other };
  }

  it("records a payment, transfers the net amount, and keeps the protocol fee", async function () {
    const { nataFinance, sender, recipient } = await deployFixture();
    const grossAmount = ethers.parseEther("100");
    const expectedFee = grossAmount / 200n;
    const expectedNet = grossAmount - expectedFee;

    const tx = nataFinance
      .connect(sender)
      .sendPayment(recipient.address, 150000n, "Invoice #108", { value: grossAmount });

    await expect(tx).to.changeEtherBalances(
      [sender, recipient, nataFinance],
      [-grossAmount, expectedNet, expectedFee]
    );

    await expect(tx)
      .to.emit(nataFinance, "PaymentSent")
      .withArgs(
        sender.address,
        recipient.address,
        grossAmount,
        expectedNet,
        expectedFee,
        150000n,
        "Invoice #108",
        anyValue
      );

    const sent = await nataFinance.getSentPayments(sender.address);
    const received = await nataFinance.getReceivedPayments(recipient.address);

    expect(sent).to.have.lengthOf(1);
    expect(received).to.have.lengthOf(1);
    expect(sent[0].sender).to.equal(sender.address);
    expect(sent[0].recipient).to.equal(recipient.address);
    expect(sent[0].grossAmount).to.equal(grossAmount);
    expect(sent[0].netAmount).to.equal(expectedNet);
    expect(sent[0].fee).to.equal(expectedFee);
    expect(sent[0].ngnReference).to.equal(150000n);
    expect(sent[0].memo).to.equal("Invoice #108");
    expect(await nataFinance.totalPayments()).to.equal(1n);
    expect(await nataFinance.totalVolumeWei()).to.equal(grossAmount);
    expect(await nataFinance.contractBalance()).to.equal(expectedFee);
  });

  it("rejects invalid payments", async function () {
    const { nataFinance, sender, recipient } = await deployFixture();

    await expect(
      nataFinance.connect(sender).sendPayment(recipient.address, 1n, "Memo")
    ).to.be.revertedWith("NataFinance: amount must be > 0");

    await expect(
      nataFinance
        .connect(sender)
        .sendPayment(sender.address, 1n, "Memo", { value: ethers.parseEther("1") })
    ).to.be.revertedWith("NataFinance: cannot send to yourself");

    await expect(
      nataFinance
        .connect(sender)
        .sendPayment(recipient.address, 1n, "", { value: ethers.parseEther("1") })
    ).to.be.revertedWith("NataFinance: memo is required");
  });

  it("allows only the owner to withdraw retained fees", async function () {
    const { nataFinance, owner, sender, recipient, other } = await deployFixture();
    const grossAmount = ethers.parseEther("10");
    const expectedFee = grossAmount / 200n;

    await nataFinance
      .connect(sender)
      .sendPayment(recipient.address, 15000n, "Family support", { value: grossAmount });

    await expect(
      nataFinance.connect(other).withdrawFees(other.address)
    ).to.be.revertedWith("NataFinance: not owner");

    await expect(nataFinance.connect(owner).withdrawFees(owner.address)).to.changeEtherBalances(
      [owner, nataFinance],
      [expectedFee, -expectedFee]
    );
  });
});
