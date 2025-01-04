import { usePublicClient, useAccount } from 'wagmi';
import { parseAbiItem } from 'viem';
import { SuperPionerosDAOAddress } from '../constants';

// Función para obtener la caché del localStorage
function getVoteCache() {
  const cache = localStorage.getItem('voteCache');
  return cache ? JSON.parse(cache) : {};
}

// Función para guardar la caché en localStorage
function saveVoteCache(cache) {
  localStorage.setItem('voteCache', JSON.stringify(cache));
}

export async function hasUserVotedInProposal(proposalId, address, publicClient) {
  const cacheKey = `${proposalId}-${address}`;
  const voteCache = getVoteCache();
  try {
    const currentBlock = await publicClient.getBlockNumber();
    const oneMonthBlocksAgo = currentBlock - 216000n; // Aproximadamente 1 meses
    const logs = await publicClient.getLogs({
      address: SuperPionerosDAOAddress,
      event: parseAbiItem('event ProposalVoted(uint256 indexed proposalIndex, address indexed voter, uint8 vote)'),
      args: {
        proposalIndex: proposalId,
        voter: address
      },
      fromBlock:oneMonthBlocksAgo
    });
    
    const hasVoted = logs.length > 0;
    
    // Almacenar el resultado en caché con timestamp
    voteCache[cacheKey] = { hasVoted, timestamp: Date.now() };
    saveVoteCache(voteCache);

    return hasVoted;
  } catch (error) {
    console.error("Error checking vote status:", error);
    return false;
  }
}

  // Función para limpiar la caché (llamar según sea necesario)
export function clearVoteCache() {
  localStorage.removeItem('voteCache');
}
