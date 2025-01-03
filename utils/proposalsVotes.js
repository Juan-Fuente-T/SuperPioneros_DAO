import { usePublicClient, useAccount } from 'wagmi';
import { parseAbiItem } from 'viem';
import { SuperPionerosDAOAddress } from '../constants';

export async function hasUserVotedInProposal(proposalId, address, publicClient) {
  try {
    const logs = await publicClient.getLogs({
      address: SuperPionerosDAOAddress,
      event: parseAbiItem('event ProposalVoted(uint256 indexed proposalIndex, address indexed voter, uint8 vote)'),
      args: {
        proposalIndex: proposalId,
        voter: address
      },
      fromBlock: 7407862n
    });
    
    return logs.length > 0;
  } catch (error) {
    console.error("Error checking vote status:", error);
    return false;
  }
}
