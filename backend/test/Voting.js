const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tests unitairs pour le contrat Voting", function () {
  let Voting;
  let owner, secondAccount, thirdAccount;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    secondAccount = signers[1];
    thirdAccount = signers[2];
    
    Voting = await ethers.deployContract("Voting");
  });

  it("Connection des électeurs avec leur age", async function () {
    const ageSecond = 20;
    await Voting.connect(secondAccount).loginVoter(ageSecond);
    const secondVoter = await Voting.getVoter(secondAccount.address);
    expect(secondVoter.age).to.equal(ageSecond);

    const ageThird = 30;
    await Voting.connect(thirdAccount).loginVoter(ageThird);
    const thirdVoter = await Voting.getVoter(thirdAccount.address);
    expect(thirdVoter.age).to.equal(ageThird);
  });

  it("Mise sur liste blanche de plusieurs électeurs", async function () {
    await Voting.connect(owner).whitelist(secondAccount.address);
    const secondVoter = await Voting.getVoter(secondAccount.address);
    expect(secondVoter.isRegistered).to.be.true;

    await Voting.connect(owner).whitelist(thirdAccount.address);
    const thirdVoter = await Voting.getVoter(thirdAccount.address);
    expect(thirdVoter.isRegistered).to.be.true;
  });

  it("Ajout d'une proposition par un électeur : vérifier la description", async function () {
    await Voting.connect(owner).startProposalsRegistration();

    await Voting.connect(secondAccount).addProposal("Ceci est une proposition 0");
    await Voting.connect(thirdAccount).addProposal("Ceci est une proposition 1");

    const proposals = await Voting.getProposals();

    expect(proposals[0].description).to.equal("Ceci est une proposition 0");
    expect(proposals[1].description).to.equal("Ceci est une proposition 1");
  });

  it("Ajout d'une proposition par un électeur : vérifier nombre de vote à 0", async function () {
    const proposals = await Voting.getProposals();

    expect(proposals[0].voteCount).to.equal(0);
    expect(proposals[1].voteCount).to.equal(0);
  });

  it("Ajout d'une proposition par un électeur : vérifier address de celui qui a soumit la proposition", async function () {
    const proposals = await Voting.getProposals();

    expect(proposals[0].voterAddress).to.equal(secondAccount.address);
    expect(proposals[1].voterAddress).to.equal(thirdAccount.address);
  });

  it("Un électeur vote pour une proposition", async function () {
    await Voting.connect(owner).endProposalsRegistration();
    await Voting.connect(owner).startVotingSession();

    await Voting.connect(secondAccount).voteProposal(0);

    const proposals = await Voting.getProposals();
    expect(proposals[0].voteCount).to.equal(1);
  });

  it("Un électeur annule son vote", async function () {
    await Voting.connect(secondAccount).voteWithdraw();

    const proposals = await Voting.getProposals();
    expect(proposals[0].voteCount).to.equal(0);
  });

  it("Proposition victorieuse", async function () {
      await Voting.connect(secondAccount).voteProposal(0);

      await Voting.connect(owner).endVotingSession();
     
      const winP = await Voting.connect(secondAccount).getWinner();

      const proposals = await Voting.getProposals();
      expect(winP.voterAddress).to.equal(proposals[0].voterAddress);
  });
});