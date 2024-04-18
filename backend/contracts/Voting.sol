// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Voting is Ownable {

  constructor() Ownable(msg.sender) {
    _sessionState = WorkflowStatus.RegisteringVoters;
  }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
        uint age;
    }

    struct Proposal {
        string description;
        uint voteCount;
        address voterAddress;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    Proposal[] private _proposalsList;
    mapping(address=>Voter) public  _votersList;

    WorkflowStatus private _sessionState;
    
    /// Obtenir la liste des propositions
    function getProposals() public view returns(Proposal[] memory) {
        return _proposalsList;
    }

    /// Obtenir l'état de la session
    function getSessionState() public view returns(WorkflowStatus) {
        return _sessionState;
    }

    function getVoter(address _address) public view returns(Voter memory) {
        return _votersList[_address];
    }

    /// Vérifie si la session d'enregistrement des électeurs est en cours
    modifier isInRegistrationTime() {
        require(_sessionState == WorkflowStatus.RegisteringVoters,"You can't do this action because it's not the voter registration period");
        _;
    }

    /// Vérifie si la session d'enregistrement des propositions est commencée
    modifier isInProposalsRegistration() {
        require(_sessionState == WorkflowStatus.ProposalsRegistrationStarted, "You can't do this action because it's not the proposal registration period.");
        _;
    }

    /// Vérifie si la session d'enregistrement des propositions est terminée
    modifier proposalsRegistrationIsEnded() {
        require(_sessionState == WorkflowStatus.ProposalsRegistrationEnded,"You cannot perform this action as it is not the end of the proposal registration period");
        _;
    }

    /// Vérifie si la session d'enregistrement des votes est commencée
    modifier isInProposalVoting() {
        require(_sessionState == WorkflowStatus.VotingSessionStarted, "You can't do this action because it's not the  voting period.");
        _;
    }

    /// Vérifie si la session d'enregistrement des votes est terminée
    modifier proposalVotingIsEnded() {
        require(_sessionState == WorkflowStatus.VotingSessionEnded, "You can't do this action because it's not the  voting period.");
        _;
    }

    /// Vérifie si un electeur est enregistré
    modifier isRegistered() {
        require(_votersList[msg.sender].isRegistered == true,"You're not registered");
        _;
    }

    // Vérifie si un électeur a voté
    modifier hasVoted() {
        require(_votersList[msg.sender].hasVoted != true,"You have already voted for a proposal");
        _;
    }

    /// Débute la session d'enregistrement des électeurs
    function startProposalsRegistration() public onlyOwner isInRegistrationTime {
        _sessionState = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// Termine la session d'enregistrement des électeurs
    function endProposalsRegistration() public onlyOwner isInProposalsRegistration {
        _sessionState = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// Débute la session de vote des électeurs
    function startVotingSession() public onlyOwner proposalsRegistrationIsEnded {
        _sessionState = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// Termine la session de vote des électeurs
    function endVotingSession() public onlyOwner isInProposalVoting {
        _sessionState = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /// Permet à un utilisateur de s'enregistrer en tant qu'électeur
    function loginVoter(uint _age) public {
        _votersList[msg.sender] = Voter(false,false,0,_age);
    }

    /// Permet à l'admin de whitelist un électeur
    function whitelist(address _address) public onlyOwner isInRegistrationTime {
        _votersList[_address].isRegistered = true;
        emit VoterRegistered(_address);
    }

    /// Ajoute une nouvelle proposition
    function addProposal(string memory _description) public isRegistered isInProposalsRegistration  {
        _proposalsList.push(Proposal(_description,0,msg.sender));
        uint proposalId = _proposalsList.length-1;
        emit ProposalRegistered(proposalId);
    }

    /// Permet de voter pour une proposition
    function voteProposal(uint _proposalId) public isRegistered isInProposalVoting hasVoted {
        Voter memory voter = _votersList[msg.sender];
        voter.hasVoted = true;
        voter.votedProposalId = _proposalId;
        _proposalsList[_proposalId].voteCount ++;
    }

    /// Permet de retirer le vote de la proposition
    function voteWithdraw() public isRegistered isInProposalVoting {
        Voter memory voter = _votersList[msg.sender];
        voter.hasVoted=false;
        (_proposalsList[voter.votedProposalId]).voteCount -= 1;
        voter.votedProposalId=0;
    } 

    /// Permet d'obtenir la proposition vainceur
    function getWinner() public proposalVotingIsEnded view returns(Proposal memory) {
        Proposal memory firstProposal = _proposalsList[0];
        for (uint i = 0; i < _proposalsList.length; i++) {
            if (_proposalsList[i].voteCount > firstProposal.voteCount) {
                firstProposal = _proposalsList[i];
            } else if (_proposalsList[i].voteCount == firstProposal.voteCount) {
                if (_votersList[_proposalsList[i].voterAddress].age > _votersList[firstProposal.voterAddress].age) {
                    firstProposal = _proposalsList[i];
                }
            }
        }
        return firstProposal;
    }

    function getAddress() public onlyOwner view returns(address) {
        return msg.sender;
    }

}