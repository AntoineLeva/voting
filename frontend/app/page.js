'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { abi, contractAddress } from '@/constants';

import { useAccount } from 'wagmi'
import { readContract, prepareWriteContract, writeContract } from '@wagmi/core'

import { useState } from 'react';

export default function VotingDApp() {

  const { address, isConnected } = useAccount()

  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState("");
  const [voteCount, setVoteCount] = useState([]);

  // Fonction pour récupérer le statut du workflow
  const getWorkflowStatus = async () => {
    const status = await readContract({
      address: contractAddress,
      abi: abi,
      functionName: 'getSessionState',
    });
    setWorkflowStatus(status);
  }

  // Fonction pour récupérer les propositions
  const getProposals = async () => {
    const proposals = await readContract({
      address: contractAddress,
      abi: abi,
      functionName: 'getProposals',
    });
    setProposals(proposals);
    const voteCounts = await Promise.all(proposals.map(async (proposal) => {
      return await readContract({
        address: contractAddress,
        abi: abi,
        functionName: 'getVoteCount',
        args: [proposal.id],
      });
    }));
    setVoteCount(voteCounts);
  }

  // Fonction pour enregistrer une proposition
  const registerProposal = async () => {
    if (!selectedProposal) return;
    const { request } = await prepareWriteContract({
      address: contractAddress,
      abi: abi,
      functionName: 'addProposal',
      args: [selectedProposal],
    });
    await writeContract(request);
    await getProposals();
    setSelectedProposal("");
  }

  // Fonction pour voter pour une proposition
  const voteForProposal = async (proposalId) => {
    const { request } = await prepareWriteContract({
      address: contractAddress,
      abi: abi,
      functionName: 'voteProposal',
      args: [proposalId],
    });
    await writeContract(request);
    await getProposals();
  }

  // Fonction pour commencer la session d'enregistrement des électeurs
  const startVoterRegistration = async () => {
    const { request } = await prepareWriteContract({
      address: contractAddress,
      abi: abi,
      functionName: 'startProposalsRegistration',
    });
    await writeContract(request);
    await getWorkflowStatus();
  }

  // Fonction pour terminer la session d'enregistrement des électeurs
  const endVoterRegistration = async () => {
    const { request } = await prepareWriteContract({
      address: contractAddress,
      abi: abi,
      functionName: 'endProposalsRegistration',
    });
    await writeContract(request);
    await getWorkflowStatus();
  }

  // Fonction pour commencer la session de vote
  const startVotingSession = async () => {
    const { request } = await prepareWriteContract({
      address: contractAddress,
      abi: abi,
      functionName: 'startVotingSession',
    });
    await writeContract(request);
    await getWorkflowStatus();
  }

  // Fonction pour terminer la session de vote
  const endVotingSession = async () => {
    const { request } = await prepareWriteContract({
      address: contractAddress,
      abi: abi,
      functionName: 'endVotingSession',
    });
    await writeContract(request);
    await getWorkflowStatus();
  }

  // Fonction pour comptabiliser les votes
  const tallyVotes = async () => {
    const { request } = await prepareWriteContract({
      address: contractAddress,
      abi: abi,
      functionName: 'getWinner',
    });
    await writeContract(request);
  }

  // Fonction pour consulter le résultat
  const viewResult = async () => {
    const result = await readContract({
      address: contractAddress,
      abi: abi,
      functionName: 'getWinner',
    });
    console.log("Winner:", result);
  }

  return (
    <>
      <ConnectButton />
      {isConnected ? (
        <div>
          <p>Workflow Status: {workflowStatus}</p>
          <button onClick={getWorkflowStatus}>Get Workflow Status</button>
          <hr />
          <h2>Proposals</h2>
          <ul>
            {proposals.map((proposal, index) => (
              <li key={proposal.id}>
                {proposal.description} - Votes: {voteCount[index]}
                <button onClick={() => voteForProposal(proposal.id)}>Vote</button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={selectedProposal}
            onChange={(e) => setSelectedProposal(e.target.value)}
          />
          <button onClick={registerProposal}>Register Proposal</button>
          <hr />
          <button onClick={startVoterRegistration}>Start Voter Registration</button>
          <button onClick={endVoterRegistration}>End Voter Registration</button>
          <button onClick={startVotingSession}>Start Voting Session</button>
          <button onClick={endVotingSession}>End Voting Session</button>
          <button onClick={tallyVotes}>Tally Votes</button>
          <button onClick={viewResult}>View Result</button>
        </div>
      ) : (
        <p>Please connect your Wallet to our DApp.</p>
      )}
    </>
  )
}
