import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingModule = buildModule("VotingModule", (m) => {

  const Voting = m.contract("Voting");

  return { Voting };
});

export default VotingModule;