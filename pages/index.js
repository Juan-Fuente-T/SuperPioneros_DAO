import {
  SuperPionerosDAOABI,
  SuperPionerosDAOAddress,
  SuperPionerosNFTABI,
  SuperPionerosNFTAddress,
} from "@/constants";
import { cleanSpecificVoteCache, hasUserVotedInProposal } from "../utils/proposalsVotes";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import React, { useEffect, useState } from "react";
// import { formatEther } from "viem/utils";
import { useAccount, useBalance, useContractRead, usePublicClient } from "wagmi";
import { readContract, waitForTransaction, writeContract, simulateContract } from "wagmi/actions";
import styles from "../styles/Home.module.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  // Check if the user's wallet is connected, and it's address using Wagmi's hooks.
  const { address, isConnected } = useAccount();
  // State variable to know if the component has been mounted yet or not
  const [isMounted, setIsMounted] = useState(false);
  // State variable to show loading state when waiting for a transaction to go through
  const [loading, setLoading] = useState(false);
  // Fake NFT Token ID to purchase. Used when creating a proposal.
  // const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  const [description, setDescription] = useState("");
  // State variable to store all proposals in the DAO
  const [proposals, setProposals] = useState([]);
  // State variable to switch between the 'Create Proposal' and 'View Proposals' tabs
  const [selectedTab, setSelectedTab] = useState("");
  // State variable to store the user's balance of SuperPioneros NFT
  const [nftUserBalance, setNftUserBalance] = useState(null);
  // State variable to store the previous user's balance of SuperPioneros NFT
  // const [prevNftBalanceState, setPrevNftBalanceState] = useState(null); // Initial state
  const [proposalCreated, setProposalCreated] = useState(false);
  const [voteCast, setVoteCast] = useState(false);
  // const [proposalDeleted, setProsalDeleted] = useState(false);
  const [proposalExecuted, setProposalExecuted] = useState(false);
  const [addressToMint, setAddressToMint] = useState("");
  const publicClient = usePublicClient();
  // Fetch the owner of the DAO
  const daoOwner = useContractRead({
    abi: SuperPionerosDAOABI,
    address: SuperPionerosDAOAddress,
    functionName: "owner",
  });

  // Fetch the balance in eth of the DAO
  const daoBalance = useBalance({
    address: SuperPionerosDAOAddress,
  });

  // Fetch the number of proposals in the DAO
  const numOfProposalsInDAO = useContractRead({
    abi: SuperPionerosDAOABI,
    address: SuperPionerosDAOAddress,
    functionName: "numProposals",
  });

  // Fetch the SuperPioneros NFT balance of the user
  const nftBalanceOfUser = useContractRead({
    abi: SuperPionerosNFTABI,
    address: SuperPionerosNFTAddress,
    functionName: "balanceOf",
    args: [address],
    enabled: Boolean(address), // Solo se ejecuta si 'address' es válido
  });


  // Piece of code that runs everytime the value of `selectedTab` or `nftBalanceOfUser` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab
  useEffect(() => {
    if (nftBalanceOfUser?.data !== undefined && nftBalanceOfUser?.data !== null) {
      const currentNftBalance = parseInt(nftBalanceOfUser.data.toString());
      setNftUserBalance(currentNftBalance);
    }
    setIsMounted(true);

    if (selectedTab === "Ver Propuestas") {
      fetchAllProposals();
    }
    // Reset event flags after fetching
    setProposalCreated(false);
    setVoteCast(false);
    setProposalExecuted(false);
  }, [selectedTab, proposalCreated, voteCast, proposalExecuted]);


/**
 * Mints an NFT to the specified address.
 * 
 * Initiates a transaction to mint an NFT using the `mint` function of the SuperPionerosNFT contract.
 * Displays success or error messages based on the transaction outcome.
 * 
 * Steps:
 * 1. Sets the loading state to true.
 * 2. Calls the `mint` function with the provided address to mint the NFT.
 * 3. Waits for the transaction confirmation.
 * 4. If successful, displays a success message with the transaction hash.
 * 5. If there is an error, handles various error cases and displays appropriate error messages.
 * 6. Resets the loading state and clears the address to mint.
 */
  async function mintNFT() {
    setLoading(true);
    try {
      const { hash } = await writeContract({
        address: SuperPionerosNFTAddress,
        abi: SuperPionerosNFTABI,
        functionName: "mint",
        args: [addressToMint],
      });
      try {
        await waitForTransaction({ hash });
      } catch (waitError) {
        // If we get TransactionNotFoundError but have a hash, check the transaction
        if (waitError.name === 'TransactionNotFoundError' && hash) {
          // The transaction was likely successful since we got a hash
          console.log('Mint transaction confirmed successful. Hash:', hash);
          window.alert('Mint transaction was successful! Hash: ' + hash);
          return;
        }
        throw waitError;
      }
      // Transaction confirmed successfully
      console.log('Mint confirmed:', hash);
      window.alert('Minted successfully!');

    } catch (error) {
      console.error("Error minting NFT:", error);
      window.alert(`Error: ${error.message}` || "Error minting NFT");
      // Check if it's a timeout error
      if (error.message === 'Transaction confirmation timeout') {
        window.alert('Transaction was sent but confirmation is taking longer than expected. Please check your wallet or the explorer for confirmation.');
        return;
      }

      // Handle other errors
      if (error.message.includes('user rejected')) {
        window.alert('Transaction was rejected by user');
      } else {
        window.alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setAddressToMint("");
    }
  }




  /**
   * Creates a proposal on the DAO contract. Requires the user to own at least one SuperPionerosNFT.
   * @param {string} description - Brief description of the proposal.
   */
  async function createProposal() {
    if (nftUserBalance === 0 || nftUserBalance === undefined || parseInt(nftBalanceOfUser?.data?.toString()) === 0) {
      alert("Lo siento, no eres poseedor del NFT y no puedes crear propuestas")
      return;
    }
    setLoading(true);
    try {
      const { hash } = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "createProposal",
        args: [description],
      });
      try {
        await waitForTransaction({ hash });
      } catch (waitError) {
        // If we get TransactionNotFoundError but have a hash, check the transaction
        if (waitError.name === 'TransactionNotFoundError' && hash) {
          // The transaction was likely successful since we got a hash
          console.log('Transaction confirmed successful. Hash:', hash);
          window.alert('Transaction was successful! Hash: ' + hash);
          return;
        }
        throw waitError;
      }
      // Transaction confirmed successfully
      setProposalCreated(true);
      console.log('Proposal created:', hash);
      window.alert('Proposal created successfully!');

    } catch (error) {
      console.error("Error creating proposal:", error);
      window.alert(`Error: ${error.message}` || "Error creating proposal");
      // Check if it's a timeout error
      if (error.message === 'Transaction confirmation timeout') {
        window.alert('Transaction was sent but confirmation is taking longer than expected. Please check your wallet or the explorer for confirmation.');
        return;
      }

      // Handle other errors
      if (error.message.includes('user rejected')) {
        window.alert('Transaction was rejected by user');
      } else {
        window.alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setDescription("");
    }
  }
  //   try {
  //     const tx = await writeContract({
  //       address: SuperPionerosDAOAddress,
  //       abi: SuperPionerosDAOABI,
  //       functionName: "createProposal",
  //       args: [description],
  //     });

  //     // await waitForTransaction(tx);
  //     const receipt = await waitForTransaction({
  //       hash: tx.hash,
  //       confirmations: 1,
  //       timeout: 60000 // 60 segundos
  //     });
  //     console.log("Transaction confirmed:", receipt);
  //     setProposalCreated(true);
  //   } catch (error) {
  //     console.error("Error creating proposal:", error);
  //     window.alert(error.message || "Error creating proposal");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

/**
 * Fetches a proposal by its ID from the SuperPionerosDAO contract.
 * 
 * @param {number} id - The ID of the proposal to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing
 * the proposal details, or null if an error occurs.
 * 
 * The returned object contains the following fields:
 * - proposalId: The ID of the proposal.
 * - deadline: The deadline of the proposal as a Date object.
 * - yayVotes: The number of yay votes as a string.
 * - nayVotes: The number of nay votes as a string.
 * - executed: A boolean indicating whether the proposal has been executed.
 * - description: The description of the proposal as a string.
 * - hasVoted: A boolean indicating whether the user has voted on the proposal.
 */
  async function fetchProposalById(id) {
    try {
      const proposal = await readContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "proposals",
        args: [id],
      });
      if (!proposal) {
        throw new Error(`No se pudo obtener la propuesta con ID: ${id}`);
      }

      const [deadline, yayVotes, nayVotes, executed, description] = proposal;
      const hasVoted = await hasUserVotedInProposal(id, address, publicClient);
      
      const parsedProposal = {
        proposalId: id,
        deadline: new Date(parseInt(deadline.toString()) * 1000),
        yayVotes: yayVotes.toString(),
        nayVotes: nayVotes.toString(),
        executed: Boolean(executed),
        description: description.toString(),
        hasVoted: hasVoted,
      };
      if(deadline < Date.now()) cleanSpecificVoteCache(id, address);
      
      return parsedProposal;
    } catch (error) {
      console.error(error);
      window.alert(error);
      return null;
    }
  }

/**
 * Fetches all proposals from the SuperPionerosDAO contract.
 * 
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects
 * containing the proposal details, or an empty array if an error occurs.
 * 
 * The returned array contains objects with the following fields:
 * - proposalId: The ID of the proposal.
 * - deadline: The deadline of the proposal as a Date object.
 * - yayVotes: The number of yay votes as a string.
 * - nayVotes: The number of nay votes as a string.
 * - executed: A boolean indicating whether the proposal has been executed.
 * - description: The description of the proposal as a string.
 * - hasVoted: A boolean indicating whether the user has voted on the proposal.
 */
  async function fetchAllProposals() {
    setLoading(true);
    try {
      const proposals = [];

      for (let i = 1; i <= numOfProposalsInDAO?.data; i++) {
        const proposal = await fetchProposalById(i);
        if (proposal) {
          proposals.push(proposal);
        } else {
          console.warn(`Propuesta con ID ${i} no se pudo obtener y será omitida.`);
        }
      }

      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error("Error al obtener todas las propuestas:", error);
      window.alert(`Error al obtener propuestas: ${error.message}`);
    }finally {
      setLoading(false);
    }
  }

/**
 * Casts a vote on a specified proposal.
 *
 * Initiates a transaction to vote on a proposal in the SuperPionerosDAO contract.
 * Displays success or error messages based on the transaction outcome.
 *
 * @param {number} proposalId - The ID of the proposal to vote on.
 * @param {string} vote - The type of vote to cast, either "Si" or "No".
 *
 * Steps:
 * 1. Sets the loading state to true.
 * 2. Calls the `voteOnProposal` function with the specified proposalId and vote.
 * 3. Waits for the transaction confirmation.
 * 4. If successful, displays a success message with the transaction hash.
 * 5. If there is an error, handles various error cases and displays appropriate error messages.
 * 6. Resets the loading state.
 */
  async function voteForProposal(proposalId, vote) {
    setLoading(true);
    try {
      const { hash } = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "voteOnProposal",
        args: [proposalId, vote === "Si" ? 0 : 1],
      });
      try {
        await waitForTransaction({ hash });
      } catch (waitError) {
        // If we get TransactionNotFoundError but have a hash, check the transaction
        if (waitError.name === 'TransactionNotFoundError' && hash) {
          // The transaction was likely successful since we got a hash
          console.log('Vote transaction confirmed successful. Hash:', hash);
          window.alert('Vote transaction was successful! Hash: ' + hash);
          return;
        }
        throw waitError;
      }
      // Transaction confirmed successfully
      setVoteCast(true);
      console.log('Vote confirmed:', hash);
      window.alert('Proposal voted successfully!');

    } catch (error) {
      console.error("Error voting proposal:", error);
      window.alert(`Error: ${error.message}` || "Error voting proposal");
      // Check if it's a timeout error
      if (error.message === 'Transaction confirmation timeout') {
        window.alert('Transaction was sent but confirmation is taking longer than expected. Please check your wallet or the explorer for confirmation.');
        return;
      }

      // Handle other errors
      if (error.message.includes('user rejected')) {
        window.alert('Transaction was rejected by user');
      } else {
        window.alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }
  /**
   * Executes a proposal on the DAO contract after its deadline has been exceeded
   * @param {number} proposalId - the index of the proposal to execute in the proposals array
   */
  async function executeProposal(proposalId) {
    setLoading(true);
    try {
      // const tx = await writeContract({
      const { hash } = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "executeProposal",
        args: [proposalId],
      });

      // await waitForTransaction(tx);
      // } catch (error) {
      //   console.error(error);
      //   window.alert(error);
      // }
      try {
        await waitForTransaction({ hash });
      } catch (waitError) {
        // If we get TransactionNotFoundError but have a hash, check the transaction
        if (waitError.name === 'TransactionNotFoundError' && hash) {
          // The transaction was likely successful since we got a hash
          console.log('Execute transaction confirmed successful. Hash:', hash);
          window.alert('Execute transaction was successful! Hash: ' + hash);
          return;
        }
        throw waitError;
      }
      // Transaction confirmed successfully
      setProposalExecuted(true);
      console.log('Executed confirmed:', hash);
      window.alert('Proposal executed successfully!');
    } catch (error) {
      console.error("Error executing proposal:", error);
      window.alert(`Error: ${error.message}` || "Error executing proposal");
      // Check if it's a timeout error
      if (error.message === 'Transaction confirmation timeout') {
        window.alert('Transaction was sent but confirmation is taking longer than expected. Please check your wallet or the explorer for confirmation.');
        return;
      }

      // Handle other errors
      if (error.message.includes('user rejected')) {
        window.alert('Transaction was rejected by user');
      } else {
        window.alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }
  /**
   * Withdraws the balance of the DAO contract to the owner's wallet.
   *
   * Initiates a transaction to withdraw the balance of the DAO contract.
   * Displays success or error messages based on the transaction outcome.
   *
   * Steps:
   * 1. Sets the loading state to true.
   * 2. Calls the `withdrawEther` function with no arguments.
   * 3. Waits for the transaction confirmation.
   * 4. If successful, displays a success message with the transaction hash.
   * 5. If there is an error, handles various error cases and displays appropriate error messages.
   * 6. Resets the loading state and refetches the DAO balance.
   */
  async function withdrawDAOEther() {
    setLoading(true);
    try {
      const { hash } = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "withdrawEther",
        args: [],
      });
      try {
        await waitForTransaction({ hash });
      } catch (waitError) {
        // If we get TransactionNotFoundError but have a hash, check the transaction
        if (waitError.name === 'TransactionNotFoundError' && hash) {
          // The transaction was likely successful since we got a hash
          console.log('Withdraw transaction confirmed successful. Hash:', hash);
          window.alert('Withdraw transaction was successful! Hash: ' + hash);
          return;
        }
        throw waitError;
      }
      // Transaction confirmed successfullyset
      console.log('Withdraw confirmed hash:', hash);
      window.alert('Withdraw successfully!');
    } catch (error) {
      console.error("Error withdrawing balance:", error);
      window.alert(`Error: ${error.message}` || "Error Withdrawing balance");
      // Check if it's a timeout error
      if (error.message === 'Transaction confirmation timeout') {
        window.alert('Transaction was sent but confirmation is taking longer than expected. Please check your wallet or the explorer for confirmation.');
        return;
      }

      // Handle other errors
      if (error.message.includes('user rejected')) {
        window.alert('Transaction was rejected by user');
      } else {
        window.alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
      daoBalance.refetch();
    }
  }

/**
 * Renders the content based on the selected tab.
 *
 * Determines which tab is currently selected and calls the appropriate
 * render function to display its content.
 *
 * @returns {JSX.Element|null} The rendered content for the selected tab,
 * or null if no tab is selected.
 */
  function renderTabs() {
    if (selectedTab === "Crear Propuestas") {
      return renderCreateProposalTab();
    } else if (selectedTab === "Ver Propuestas") {
      return renderViewProposalsTab();
    }
    return null;
  }
  /**
   * Renders the content of the "Crear Propuestas" tab.
   *
   * If the user is loading, renders a loading message.
   * If the user doesn't have the SuperPionero NFT, renders a message
   * indicating that they can't create proposals.
   * Otherwise, renders a text area for the user to input the description
   * of the proposal and a button to create the proposal.
   *
   * @returns {JSX.Element|null} The rendered content, or null if no content
   * should be rendered.
   */
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.loading}>
          <p>Cargando... Esperando a la transacción...</p>
        </div>
      );
    } else if (nftUserBalance === 0 || nftUserBalance === null || parseInt(nftBalanceOfUser?.data?.toString()) === 0 || nftBalanceOfUser?.data === undefined) {
      return (
        <div className={styles.description}>
          <p>No posees el NFT SuperPionero. <br />
            <b>No puedes crear propuestas</b></p>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Descripcion de la propuesta: </label>
          <textarea
            className={styles.description_input}
            placeholder="Descripción"
            maxLength="300"
            rows="4" cols="90"
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          <button className={styles.create_button} onClick={createProposal}>
            Crear
          </button>
        </div>
      );
    }
  }

/**
 * Renders the content of the "Ver Propuestas" tab.
 *
 * Displays the proposals and facilitates user interaction based on the user's
 * NFT ownership and the proposals' status. If loading, shows a loading message.
 * If there are no proposals, displays a message indicating that no proposals
 * have been created. If the user doesn't own the SuperPionero NFT, shows a
 * message indicating that they cannot view or vote on proposals.
 * Otherwise, displays the list of proposals with their details and provides
 * options to vote or execute them based on their current status.
 *
 * @returns {JSX.Element} The rendered content based on the user's NFT
 * ownership and the current status of proposals.
 */
  function renderViewProposalsTab() {
    const hasNft = nftUserBalance !== null && nftUserBalance > 0;

    if (loading) {
      return (
        <div className={styles.loading}>
          <p>Cargando... Espere unos instantes, por favor...</p>
          </div>
      );
    } else if (proposals?.length === 0) {
      return (
        <div className={styles.description}>
          <p>No se han creado propuestas</p>
        </div>
      );
    } else if (!hasNft) {
      return (
        <div className={styles.description}>
          <p>No posees el NFT SuperPionero. <br />
            <b>No puedes ver o votar propuestas.</b></p>
        </div>
      );
    } else {
      return (
        <div className={styles.proposals_container}>
          <div className={styles.proposals}>
            {proposals.map((p, index) => (
              <div key={index} className={styles.card}>
                <p className={styles.proposalDetail}>Propuesta ID: {p.proposalId}</p>
                {/* <p>Fake NFT to Purchase: {p.nftTokenId}</p> */}
                <p>Descripcion: {p.description}</p>
                <p className={styles.proposalDetail}>Deadline: {p.deadline.toLocaleString()}</p>
                <p className={styles.proposalDetail}>Votos Si: {p.yayVotes}</p>
                <p className={styles.proposalDetail}>Votos No: {p.nayVotes}</p>
                {/* <p>Ejecutada?: {p.executed.toString()}</p>  */}
                {p.deadline > Date.now() && !p.executed ? (
                  <div className={styles.flex}>
                    <button
                      className={styles.button2}
                      onClick={() => voteForProposal(p.proposalId, "Si")}
                    >
                     {p.hasVoted ?  "Votado" : "Votar Si"}
                    </button>
                    <button
                      className={styles.button2}
                      onClick={() => voteForProposal(p.proposalId, "No")}
                    >
                     {p.hasVoted ?  "Votado" : "Votar No"}
                    </button>
                  </div>
                ) : p.deadline  < Date.now() && !p.executed ? (
                  address && address?.toLowerCase() === daoOwner?.data?.toLowerCase() ? (
                    <div className={styles.flex}>
                      <button
                        className={styles.button2}
                        onClick={() => executeProposal(p.proposalId)}
                      >
                        Ejecutar Propuesta{" "}
                        {p.yayVotes > p.nayVotes ? "(Si)" : "(No)"}
                      </button>
                    </div>
                  ) : null
                ) : (
                  <div className={styles.description}>Propuesta ejecutada</div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Piece of code that runs everytime the value of `selectedTab` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab
  // useEffect(() => {
  //   if (selectedTab === "Ver Propuestas") {
  //     fetchAllProposals();
  //   }
  // }, [selectedTab]);

  // useEffect(() => {
  //   if (nftBalanceOfUser?.data) {
  //     setNftUserBalance(nftBalanceOfUser?.data);
  //   }
  //   setIsMounted(true);
  // }, [nftBalanceOfUser?.data]);


  if (!isMounted) return null;

  if (!isConnected)
    return (
      <div className={styles.ext_container}>
        <div className={styles.ext_container_connectButton}>
        <ConnectButton />
        </div>
        <img id={styles.backgroundUp} src="./SuperPIoneros_fondoUp.png" />
        <div className={styles.initial_container}>
          <img
            className={styles.initial_logo_image}
            src="./SuperPionerosLogo.png" alt="SuperPionero's Community DAO logo"
          />
          <h1 className={styles.initialTitle}>Super Pioneros DAO</h1>
          <p className={styles.initialText}>Conecta tu wallet</p>
          <img id={styles.backgroundUp2} src="./SuperPIoneros_fondoUp2.png" />
          {!isConnected && 
          <div className={styles.ext_container_connectButton}>
        <ConnectButton />
        </div>}
        </div>
      </div>
    );

  return (
    <>


      <Head>
        <title>Super Pioneros DAO</title>
        <meta name="description" content="SuperPioneros DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
      <div className={styles.ext_container_connectButton}>
        <ConnectButton />
        </div>
        <img id={styles.backgroundUp} src="./SuperPIoneros_fondoUp.png" />
        <div className={styles.initialLogo}>
          <img src="./SuperPionerosLogo.png" alt="SuperPionero's Community DAO logo" />
        </div>
        <img id={styles.backgroundUp2} src="./SuperPIoneros_fondoUp2.png" />
        <div className={styles.general_container}>
          <img className={styles.initialImage} src="./superpioneros.png" alt="Bust of a inteligent robot in Superpioneros" />
          <h1 className={styles.title}>
            Super Pioneros <br></br> DAO
          </h1>
          {!isConnected && <ConnectButton />}
        </div>

        <div className={styles.image_container}>
          <img id={styles.backgroundDown} src="./SuperPIoneros_fondoDown.png" />
          <div className={styles.descriptions}>
            <h2>Bienvenido a nuestra DAO!</h2>
            <h3>
              La Dao de los innovadores, aquellos que ven cosas
              donde no las hay. La de los inquietos, los que crean y
              construyen, de los que saben que soñar es imaginar el futuro.
            </h3>
            <h3>
              Este el punto neurálgico de nuestra comunidad, una comunidad que
              habla el mismo idioma, y donde sabemos que las cosas se pueden
              hacer de un modo distinto.
            </h3>
          </div>
          <div className={styles.description_info}>
            <p id="prueba" className={styles.primer_p}>
              Eres poseedor de {nftBalanceOfUser?.data?.toString()}{" "}
              SuperPioneros NFT{" "}
            </p>
            <p>
              Numero total de Propuestas:{" "}
              {numOfProposalsInDAO?.data?.toString()}
            </p>
          </div>
        </div>
        <div className={styles.container_buttons}>
          <button
            className={styles.tab_button}
            onClick={() => setSelectedTab("Crear Propuestas")}
          >
            Crear Propuestas
          </button>
          <button
            className={styles.tab_button}
            onClick={() => setSelectedTab("Ver Propuestas")}
          >
            Ver Propuestas
          </button>
        </div>
        {renderTabs()}
        {/* Display additional withdraw button if connected wallet is owner */}
        {address && address?.toLowerCase() === daoOwner?.data?.toLowerCase() ? (
          <div className={styles.withdraw_button_container}>
            {loading ? (
              <button className={styles.button}>Loading...</button>
            ) : (
              <div className={styles.withdraw_mint_container}>
                <button className={styles.withdraw_button} onClick={withdrawDAOEther}>
                  Withdraw DAO ETH
                </button>
                <input type="text" className={styles.addrees_mint} placeholder="Address to mint"
                  value={addressToMint} onChange={(e) => setAddressToMint(e.target.value)}>
                </input>
                <button className={styles.mint_button} onClick={mintNFT}>
                  Mintear NFT
                </button>
              </div>
            )}
          </div>
        ) : (
          ""
        )}
        <div className={styles.footer_container}>
          <img
            className={styles.footer_image_logo}
            src="./Juan_Fuente_Dev_Logo.png"
          />
        </div>
      </main>

      <script src="./index.js"></script>
    </>

  );
}
