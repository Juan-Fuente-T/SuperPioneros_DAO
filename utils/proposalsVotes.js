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

  // Si existe en caché y es positivo, retornar inmediatamente
  if (voteCache[cacheKey] && voteCache[cacheKey].hasVoted) {
    return true;
  }
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
// Función para limpiar una entrada específica de la caché de votos
export function cleanSpecificVoteCache(proposalId, userAddress) {
  const voteCache = getVoteCache();
  const cacheKey = `${proposalId}-${userAddress}`;

  if (voteCache[cacheKey]) {
    delete voteCache[cacheKey];
    saveVoteCache(voteCache);
    // console.log(`Entrada de caché eliminada para propuesta ${proposalId} y usuario ${userAddress}`);
  } else {
    console.log(`No se encontró entrada de caché para propuesta ${proposalId} y usuario ${userAddress}`);
  }
}

  // Función para limpiar la caché (llamar según sea necesario)
export function clearVoteCache() {
  localStorage.removeItem('voteCache');
}
