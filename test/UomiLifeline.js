const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UomiLifeline Faucet Agent (UOMI testnet)", function () {
  let Faucet, faucet, owner, user1, user2;
  const dripAmount = ethers.parseEther("0.1");
  const cooldown = 60;
  const minBalance = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    Faucet = await ethers.getContractFactory("UomiLifeline");
    faucet = await Faucet.deploy(dripAmount, cooldown, minBalance);

    // Fund faucet with 5 native UOMI (in local HH sim this is "ETH"-like)
    await owner.sendTransaction({
      to: await faucet.getAddress(),
      value: ethers.parseEther("5"),
    });
  });

  it("deploys with the correct configuration", async function () {
    expect(await faucet.dripAmount()).to.equal(dripAmount);
    expect(await faucet.cooldownTime()).to.equal(cooldown);
    expect(await faucet.minBalance()).to.equal(minBalance);
    expect(await faucet.owner()).to.equal(owner.address);
  });

  it("allows a user to claim when eligible and emits TokensClaimed", async function () {
    await expect(faucet.connect(user1).claim())
      .to.emit(faucet, "TokensClaimed")
      .withArgs(user1.address, dripAmount);
  });

  it("enforces cooldown between claims", async function () {
    await faucet.connect(user1).claim();
    await expect(faucet.connect(user1).claim()).to.be.revertedWith(
      "Wait before claiming again"
    );
  });

  it("reduces drip when balance falls below minBalance and emits DripAdjusted", async function () {
    const addr = await faucet.getAddress();

    // Set faucet balance to just below minBalance (minBalance - 1 wei)
    const target = (minBalance - 1n).toString(16);
    await ethers.provider.send("hardhat_setBalance", [addr, "0x" + target]);

    await expect(faucet.connect(user2).claim())
      .to.emit(faucet, "DripAdjusted")
      .withArgs(dripAmount / 2n)
      .and.to.emit(faucet, "TokensClaimed")
      .withArgs(user2.address, dripAmount / 2n);
  });

  it("reverts with 'Faucet dry, donate!' when funds are insufficient", async function () {
    const addr = await faucet.getAddress();
    // Set faucet balance to 0 to force revert
    await ethers.provider.send("hardhat_setBalance", [addr, "0x0"]);
    await expect(faucet.connect(user1).claim()).to.be.revertedWith("Faucet dry, donate!");
  });

  it("only owner can update config and emits ConfigUpdated", async function () {
    await expect(
      faucet.connect(user1).updateConfig(1, 1, 1)
    ).to.be.revertedWith("Not owner");

    await expect(
      faucet
        .connect(owner)
        .updateConfig(ethers.parseEther("0.2"), 120, ethers.parseEther("2"))
    )
      .to.emit(faucet, "ConfigUpdated")
      .withArgs(ethers.parseEther("0.2"), 120, ethers.parseEther("2"));

    expect(await faucet.dripAmount()).to.equal(ethers.parseEther("0.2"));
    expect(await faucet.cooldownTime()).to.equal(120);
    expect(await faucet.minBalance()).to.equal(ethers.parseEther("2"));
  });

  it("accepts donations and emits DonationReceived", async function () {
    await expect(
      faucet.connect(user1).donate({ value: ethers.parseEther("1") })
    )
      .to.emit(faucet, "DonationReceived")
      .withArgs(user1.address, ethers.parseEther("1"));
  });

  it("supports pause/unpause and ownership transfer", async function () {
    // Pause
    await expect(faucet.connect(owner).setPaused(true))
      .to.emit(faucet, "Paused")
      .withArgs(true);

    await expect(faucet.connect(user1).claim()).to.be.revertedWith("Paused");

    // Unpause
    await expect(faucet.connect(owner).setPaused(false))
      .to.emit(faucet, "Paused")
      .withArgs(false);

    // Transfer ownership
    await expect(faucet.connect(owner).transferOwnership(user2.address))
      .to.emit(faucet, "OwnershipTransferred")
      .withArgs(owner.address, user2.address);

    expect(await faucet.owner()).to.equal(user2.address);
  });
});
