// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract SuperPionerosDAO is Ownable(msg.sender) {
    // Create a struct named Proposal containing all relevant information
    struct Proposal {
        // deadline - the UNIX timestamp until which this proposal is active. Proposal can be executed after the deadline has been exceeded.
        uint256 deadline;
        // yayVotes - number of yay votes for this proposal
        uint256 yayVotes;
        // nayVotes - number of nay votes for this proposal
        uint256 nayVotes;
        // executed - whether or not this proposal has been executed yet. Cannot be executed before the deadline has been exceeded.
        bool executed;
        // voters - a mapping of SuperPionerosNFT tokenIDs to booleans indicating whether that NFT has already been used to cast a vote or not
        mapping(uint256 => bool) voters;
        //Explicacion breve de la propuesta
        string description;
    }

    // Create an enum named Vote containing possible options for a vote
    enum Vote {
        Si, // Si = 0
        No // No = 1
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;
    ERC721Enumerable superPionerosNFT;

    event ProposalCreated(uint256 indexed proposalIndex, string description);
    event ProposalVoted(uint256 indexed proposalIndex, address indexed voter, Vote vote);
    event ProposalExecuted(uint256 indexed proposalIndex);
    event EtherWithdrawed(uint256 amount);

    error NotOwner();
    error NoHaveNFT();
    error DeadlineExceeded();
    error DeadlineNotExceeded();
    error ProposalAlreadyExecuted();
    error AlreadyVoted();
    error FailedToWithdrawEther();
    error NothingToWithdraw();
    error  InvalidProposal();
    error InvalidDescription();

   constructor(address _superPionerosNFT) payable {
        superPionerosNFT = ERC721Enumerable(_superPionerosNFT);
    }


    // Create a modifier which only allows a function to be
    // called by someone who owns at least 1 SuperPionerosNFT
    modifier nftHolderOnly() {
        if(superPionerosNFT.balanceOf(msg.sender) == 0) {
            revert NoHaveNFT();
        }
        // require(superPionerosNFT.balanceOf(msg.sender) > 0, "NO ERES UN SUPER PIONERO MIEMBRO");
        _;
    }

    // Create a modifier which only allows a function to be
    // called if the given proposal's deadline has not been exceeded yet
    modifier activeProposalOnly(uint256 proposalIndex) {
        if(proposals[proposalIndex].deadline <= block.timestamp) {
            revert DeadlineExceeded();
        }
        // require(
        //     proposals[proposalIndex].deadline > block.timestamp,
        //     "DEADLINE_EXCEEDED"
        // );
        _;
    }

    // Create a modifier which only allows a function to be
    // called if the given proposals' deadline HAS been exceeded
    // and if the proposal has not yet been executed
    modifier inactiveProposalOnly(uint256 proposalIndex) {
        if(proposals[proposalIndex].deadline > block.timestamp) {
            revert DeadlineNotExceeded();
        }
        // require(
        //     proposals[proposalIndex].deadline <= block.timestamp,
        //     "DEADLINE_NOT_EXCEEDED"
        // );
        if(proposals[proposalIndex].executed) {
            revert ProposalAlreadyExecuted();
        }
        // require(
        //     proposals[proposalIndex].executed == false,
        //     "PROPOSAL_ALREADY_EXECUTED"
        // );
        _;
    }

    /// @notice Allows the contract owner to set the address of the SuperPionerosNFT contract
    /// @param _superPionerosNFT The address of the SuperPionerosNFT contract
     function setSuperPionerosNFT(address _superPionerosNFT) external{
        superPionerosNFT = ERC721Enumerable(_superPionerosNFT);
    } 
    
    /// @notice Returns the address of the SuperPionerosNFT contract
    /// @return The address of the SuperPionerosNFT contract
    function getSuperPionerosNFT() external view returns(address){
        return address(superPionerosNFT);
    }

    /// @notice Allows a SuperPionerosNFT holder to create a new proposal in the DAO
    /// @param _description The description of the proposal
    /// @return The index of the newly created proposal
        function createProposal(
        string memory _description
    ) external nftHolderOnly returns (uint256) {
        numProposals++;
        Proposal storage proposal = proposals[numProposals];
        if(keccak256(abi.encodePacked(_description)) == keccak256(abi.encodePacked(""))){
            revert InvalidDescription();
        }
        proposal.description = _description;
        // Set the proposal's voting deadline to be (current time + 60 minutes)
        proposal.deadline = block.timestamp + 60 minutes;
        emit ProposalCreated(numProposals, _description);
        return numProposals;
    }
    // This function only checks if the user has NFTs, AND the number of them.
    /// @dev voteOnProposal allows a SuperPionerosNFT holder to cast their vote on an active proposal
    /// @param proposalIndex - the index of the proposal to vote on in the proposals array
    /// @param vote - the type of vote they want to cast
    // function voteOnProposal(
    //     uint256 proposalIndex,
    //     Vote vote
    // ) external nftHolderOnly activeProposalOnly(proposalIndex) {
    //     Proposal storage proposal = proposals[proposalIndex];

    //     uint256 voterNFTBalance = superPionerosNFT.balanceOf(msg.sender);
    //     uint256 numVotes = 0;

    //     // Calculate how many NFTs are owned by the voter
    //     // that haven't already been used for voting on this proposal
    //     for (uint256 i = 0; i < voterNFTBalance; i++) {
    //         uint256 tokenId = superPionerosNFT.tokenOfOwnerByIndex(msg.sender, i);
    //         if (proposal.voters[tokenId] == false) {
    //             numVotes++;
    //             proposal.voters[tokenId] = true;
    //         }
    //     }
    //     if(numVotes == 0) {
    //         revert AlreadyVoted();
    //     }
    //     // require(numVotes > 0, "ALREADY_VOTED");

    //     if (vote == Vote.Si) {
    //         proposal.yayVotes += numVotes;
    //     } else {
    //         proposal.nayVotes += numVotes;
    //     }
    //     emit ProposalVoted(proposalIndex, msg.sender, vote);
    // }

    // This function only checks if the user has NFTs, NOT the number of them.

    /// @dev voteOnProposal allows a SuperPionerosNFT holder to cast their vote on an active proposal
    /// @param proposalIndex - the index of the proposal to vote on in the proposals array
    /// @param vote - the type of vote they want to cast
    function voteOnProposal(
        uint256 proposalIndex,
        Vote vote
    ) external nftHolderOnly activeProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];

        if(superPionerosNFT.balanceOf(msg.sender) == 0){
            revert NoHaveNFT();
        }
        if(proposal.voters[proposalIndex]) {
            revert AlreadyVoted();
        }
        proposal.voters[proposalIndex] = true;

        if (vote == Vote.Si) {
            proposal.yayVotes += 1;
        } else {
            proposal.nayVotes += 1;
        }

        emit ProposalVoted(proposalIndex, msg.sender, vote);
    }

    // TODO:--****Posibilidad de  REVISAR/ADAPTAR executeProposal para realizar acciones predeterminadas****---//
    /// @dev executeProposal allows any SuperPionerosNFT holder to execute a proposal after it's deadline has been exceeded
    /// @param proposalIndex - the index of the proposal to execute in the proposals array
    function executeProposal(
        uint256 proposalIndex
    ) external onlyOwner nftHolderOnly inactiveProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];
        //Possible function for predefined action, such as purchasing an NFT
        proposal.executed = true;
        emit ProposalExecuted(proposalIndex);
    }

    /// @dev withdrawEther allows the contract owner (deployer) to withdraw the ETH from the contract
    function withdrawEther() external onlyOwner {
        uint256 amount = address(this).balance;
        if(amount == 0) {
            revert NothingToWithdraw();
        }
        // require(amount > 0, "Nothing to withdraw, contract balance empty");
        // require(sent, "FAILED_TO_WITHDRAW_ETHER");
        (bool sent, ) = payable(owner()).call{value: amount}("");
        if(!sent){
            revert FailedToWithdrawEther();
        }
        emit EtherWithdrawed(amount);
    }

    // The following two functions allow the contract to accept ETH deposits
    // directly from a wallet without calling a function
    receive() external payable {}

    fallback() external payable {}
}
