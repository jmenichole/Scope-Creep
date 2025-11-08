const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ScopeCreepInsurance", function () {
  let scopeCreepInsurance;
  let owner, freelancer, client, otherAccount;
  const projectAmount = ethers.parseEther("1.0");
  const projectScope = "Build a simple website with 3 pages";

  beforeEach(async function () {
    [owner, freelancer, client, otherAccount] = await ethers.getSigners();
    
    const ScopeCreepInsurance = await ethers.getContractFactory("ScopeCreepInsurance");
    scopeCreepInsurance = await ScopeCreepInsurance.deploy();
  });

  describe("Contract Deployment", function () {
    it("Should set the right platform owner", async function () {
      expect(await scopeCreepInsurance.platformOwner()).to.equal(owner.address);
    });

    it("Should initialize with correct constants", async function () {
      expect(await scopeCreepInsurance.PLATFORM_FEE_PERCENTAGE()).to.equal(250);
      expect(await scopeCreepInsurance.SCOPE_CHANGE_FEE_PERCENTAGE()).to.equal(2000);
      expect(await scopeCreepInsurance.MAX_SCOPE_CHANGES()).to.equal(3);
    });
  });

  describe("Agreement Creation", function () {
    it("Should create a new agreement", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).createAgreement(
          client.address,
          projectAmount,
          projectScope
        )
      ).to.emit(scopeCreepInsurance, "AgreementCreated")
        .withArgs(1, freelancer.address, client.address, projectAmount, projectScope);

      const agreement = await scopeCreepInsurance.getAgreement(1);
      expect(agreement.freelancer).to.equal(freelancer.address);
      expect(agreement.client).to.equal(client.address);
      expect(agreement.originalAmount).to.equal(projectAmount);
      expect(agreement.status).to.equal(0); // Active
    });

    it("Should reject agreement with invalid client", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).createAgreement(
          ethers.ZeroAddress,
          projectAmount,
          projectScope
        )
      ).to.be.revertedWith("Invalid client address");
    });

    it("Should reject agreement where client is the freelancer", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).createAgreement(
          freelancer.address,
          projectAmount,
          projectScope
        )
      ).to.be.revertedWith("Client cannot be freelancer");
    });

    it("Should reject agreement with zero amount", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).createAgreement(
          client.address,
          0,
          projectScope
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject agreement with empty scope", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).createAgreement(
          client.address,
          projectAmount,
          ""
        )
      ).to.be.revertedWith("Scope cannot be empty");
    });
  });

  describe("Funds Deposit", function () {
    let agreementId;

    beforeEach(async function () {
      const tx = await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      const receipt = await tx.wait();
      agreementId = 1;
    });

    it("Should allow client to deposit funds", async function () {
      await expect(
        scopeCreepInsurance.connect(client).depositFunds(agreementId, {
          value: projectAmount
        })
      ).to.emit(scopeCreepInsurance, "FundsDeposited")
        .withArgs(agreementId, projectAmount);

      const agreement = await scopeCreepInsurance.getAgreement(agreementId);
      expect(agreement.fundsDeposited).to.be.true;
    });

    it("Should reject deposit from non-client", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).depositFunds(agreementId, {
          value: projectAmount
        })
      ).to.be.revertedWith("Only client");
    });

    it("Should reject incorrect deposit amount", async function () {
      await expect(
        scopeCreepInsurance.connect(client).depositFunds(agreementId, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.revertedWith("Incorrect amount");
    });

    it("Should reject duplicate deposits", async function () {
      await scopeCreepInsurance.connect(client).depositFunds(agreementId, {
        value: projectAmount
      });

      await expect(
        scopeCreepInsurance.connect(client).depositFunds(agreementId, {
          value: projectAmount
        })
      ).to.be.revertedWith("Funds already deposited");
    });
  });

  describe("Scope Changes", function () {
    let agreementId;
    let scopeChangeCharge;

    beforeEach(async function () {
      const tx = await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      agreementId = 1;
      
      await scopeCreepInsurance.connect(client).depositFunds(agreementId, {
        value: projectAmount
      });

      scopeChangeCharge = await scopeCreepInsurance.calculateScopeChangeCharge(agreementId);
    });

    it("Should calculate correct scope change charge", async function () {
      // 20% of 1 ETH = 0.2 ETH
      expect(scopeChangeCharge).to.equal(ethers.parseEther("0.2"));
    });

    it("Should allow client to request scope change", async function () {
      await expect(
        scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
          value: scopeChangeCharge
        })
      ).to.emit(scopeCreepInsurance, "ScopeChangeRequested")
        .withArgs(agreementId, scopeChangeCharge, 1);

      const agreement = await scopeCreepInsurance.getAgreement(agreementId);
      expect(agreement.scopeChanges).to.equal(1);
      expect(agreement.currentAmount).to.equal(projectAmount + scopeChangeCharge);
    });

    it("Should emit alert on second scope change", async function () {
      // First scope change
      await scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
        value: scopeChangeCharge
      });

      // Second scope change (warning should be emitted)
      await expect(
        scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
          value: scopeChangeCharge
        })
      ).to.emit(scopeCreepInsurance, "ScopeChangeAlert")
        .withArgs(agreementId, "WARNING: One more scope change and client will be fired!", 2);
    });

    it("Should fire client after 3 scope changes", async function () {
      const initialFreelancerBalance = await ethers.provider.getBalance(freelancer.address);

      // Make 3 scope changes
      for (let i = 0; i < 3; i++) {
        await scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
          value: scopeChangeCharge
        });
      }

      const agreement = await scopeCreepInsurance.getAgreement(agreementId);
      expect(agreement.status).to.equal(2); // ClientFired

      // Check freelancer was paid
      const finalFreelancerBalance = await ethers.provider.getBalance(freelancer.address);
      expect(finalFreelancerBalance).to.be.gt(initialFreelancerBalance);
    });

    it("Should reject scope change with incorrect payment", async function () {
      await expect(
        scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWith("Incorrect additional payment");
    });

    it("Should reject scope change before funds deposited", async function () {
      const tx = await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      const newAgreementId = 2;

      await expect(
        scopeCreepInsurance.connect(client).requestScopeChange(newAgreementId, {
          value: scopeChangeCharge
        })
      ).to.be.revertedWith("Funds not deposited yet");
    });
  });

  describe("Fire Client", function () {
    let agreementId;
    let scopeChangeCharge;

    beforeEach(async function () {
      await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      agreementId = 1;
      
      await scopeCreepInsurance.connect(client).depositFunds(agreementId, {
        value: projectAmount
      });

      scopeChangeCharge = await scopeCreepInsurance.calculateScopeChangeCharge(agreementId);
    });

    it("Should allow freelancer to fire client after scope changes", async function () {
      // Make one scope change
      await scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
        value: scopeChangeCharge
      });

      await expect(
        scopeCreepInsurance.connect(freelancer).fireClient(agreementId, "Client too demanding")
      ).to.emit(scopeCreepInsurance, "ClientFired")
        .withArgs(agreementId, "Client too demanding");

      const agreement = await scopeCreepInsurance.getAgreement(agreementId);
      expect(agreement.status).to.equal(2); // ClientFired
    });

    it("Should reject firing without scope changes", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).fireClient(agreementId, "No reason")
      ).to.be.revertedWith("No scope changes to justify firing");
    });

    it("Should reject firing by non-freelancer", async function () {
      await scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
        value: scopeChangeCharge
      });

      await expect(
        scopeCreepInsurance.connect(client).fireClient(agreementId, "Reason")
      ).to.be.revertedWith("Only freelancer");
    });
  });

  describe("Complete Agreement", function () {
    let agreementId;

    beforeEach(async function () {
      await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      agreementId = 1;
      
      await scopeCreepInsurance.connect(client).depositFunds(agreementId, {
        value: projectAmount
      });
    });

    it("Should allow freelancer to complete agreement", async function () {
      const initialBalance = await ethers.provider.getBalance(freelancer.address);

      const tx = await scopeCreepInsurance.connect(freelancer).completeAgreement(agreementId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const agreement = await scopeCreepInsurance.getAgreement(agreementId);
      expect(agreement.status).to.equal(1); // Completed

      // Check payment (minus gas fees)
      const finalBalance = await ethers.provider.getBalance(freelancer.address);
      const expectedPayment = projectAmount * BigInt(10000 - 250) / BigInt(10000);
      expect(finalBalance - initialBalance + gasUsed).to.be.closeTo(expectedPayment, ethers.parseEther("0.001"));
    });

    it("Should allow client to complete agreement", async function () {
      await expect(
        scopeCreepInsurance.connect(client).completeAgreement(agreementId)
      ).to.emit(scopeCreepInsurance, "AgreementCompleted");

      const agreement = await scopeCreepInsurance.getAgreement(agreementId);
      expect(agreement.status).to.equal(1); // Completed
    });

    it("Should deduct platform fee correctly", async function () {
      await scopeCreepInsurance.connect(freelancer).completeAgreement(agreementId);

      const expectedFee = projectAmount * BigInt(250) / BigInt(10000);
      expect(await scopeCreepInsurance.totalFeesCollected()).to.equal(expectedFee);
    });

    it("Should reject completion by unauthorized user", async function () {
      await expect(
        scopeCreepInsurance.connect(otherAccount).completeAgreement(agreementId)
      ).to.be.revertedWith("Only freelancer or client can complete");
    });

    it("Should reject completion without funds deposited", async function () {
      await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      const newAgreementId = 2;

      await expect(
        scopeCreepInsurance.connect(freelancer).completeAgreement(newAgreementId)
      ).to.be.revertedWith("Funds not deposited");
    });
  });

  describe("Cancel Agreement", function () {
    let agreementId;

    beforeEach(async function () {
      await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      agreementId = 1;
    });

    it("Should allow freelancer to cancel agreement", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).cancelAgreement(agreementId)
      ).to.emit(scopeCreepInsurance, "AgreementCancelled")
        .withArgs(agreementId, freelancer.address);

      const agreement = await scopeCreepInsurance.getAgreement(agreementId);
      expect(agreement.status).to.equal(3); // Cancelled
    });

    it("Should allow client to cancel agreement", async function () {
      await expect(
        scopeCreepInsurance.connect(client).cancelAgreement(agreementId)
      ).to.emit(scopeCreepInsurance, "AgreementCancelled")
        .withArgs(agreementId, client.address);
    });

    it("Should reject cancellation after funds deposited", async function () {
      await scopeCreepInsurance.connect(client).depositFunds(agreementId, {
        value: projectAmount
      });

      await expect(
        scopeCreepInsurance.connect(freelancer).cancelAgreement(agreementId)
      ).to.be.revertedWith("Cannot cancel after funds deposited");
    });
  });

  describe("Fee Withdrawal", function () {
    let agreementId;

    beforeEach(async function () {
      await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      agreementId = 1;
      
      await scopeCreepInsurance.connect(client).depositFunds(agreementId, {
        value: projectAmount
      });
      
      await scopeCreepInsurance.connect(freelancer).completeAgreement(agreementId);
    });

    it("Should allow platform owner to withdraw fees", async function () {
      const expectedFee = projectAmount * BigInt(250) / BigInt(10000);
      const initialBalance = await ethers.provider.getBalance(owner.address);

      const tx = await scopeCreepInsurance.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance - initialBalance + gasUsed).to.be.closeTo(expectedFee, ethers.parseEther("0.001"));
      expect(await scopeCreepInsurance.totalFeesCollected()).to.equal(0);
    });

    it("Should reject withdrawal by non-owner", async function () {
      await expect(
        scopeCreepInsurance.connect(freelancer).withdrawFees()
      ).to.be.revertedWith("Only platform owner");
    });

    it("Should reject withdrawal when no fees collected", async function () {
      await scopeCreepInsurance.connect(owner).withdrawFees();
      
      await expect(
        scopeCreepInsurance.connect(owner).withdrawFees()
      ).to.be.revertedWith("No fees to withdraw");
    });
  });

  describe("Helper Functions", function () {
    let agreementId;

    beforeEach(async function () {
      await scopeCreepInsurance.connect(freelancer).createAgreement(
        client.address,
        projectAmount,
        projectScope
      );
      agreementId = 1;
    });

    it("Should correctly check if client is at risk", async function () {
      let [atRisk, changes, remaining] = await scopeCreepInsurance.isClientAtRisk(agreementId);
      expect(atRisk).to.be.false;
      expect(changes).to.equal(0);
      expect(remaining).to.equal(3);

      await scopeCreepInsurance.connect(client).depositFunds(agreementId, {
        value: projectAmount
      });

      const scopeChangeCharge = await scopeCreepInsurance.calculateScopeChangeCharge(agreementId);
      
      // Make 2 scope changes
      await scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
        value: scopeChangeCharge
      });
      await scopeCreepInsurance.connect(client).requestScopeChange(agreementId, {
        value: scopeChangeCharge
      });

      [atRisk, changes, remaining] = await scopeCreepInsurance.isClientAtRisk(agreementId);
      expect(atRisk).to.be.true;
      expect(changes).to.equal(2);
      expect(remaining).to.equal(1);
    });
  });
});
