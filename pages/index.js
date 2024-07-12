import {
  SuperPionerosDAOABI,
  SuperPionerosDAOAddress,
  SuperPionerosNFTABI,
  SuperPionerosNFTAddress,
} from "@/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import { formatEther } from "viem/utils";
import { useAccount, useBalance, useContractRead } from "wagmi";
import { readContract, waitForTransaction, writeContract } from "wagmi/actions";
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
  const [prevNftBalanceState, setPrevNftBalanceState] = useState(null); // Initial state

  
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
  
  /*console.log("ADDRESS", SuperPionerosDAOAddress);
  console.log("AbiDAO", SuperPionerosDAOABI);
  console.log("AbiNFT", SuperPionerosNFTABI);*/

  // Fetch the SuperPioneros NFT balance of the user
  const nftBalanceOfUser = useContractRead({
    abi: SuperPionerosNFTABI,
    address: SuperPionerosNFTAddress,
    functionName: "balanceOf",
    args: [address],
  });
  // console.log("UserBalance", nftBalanceOfUser?.data);
  // console.log("nftBalanceOfUserData", nftBalanceOfUser.data);
  
  // Piece of code that runs everytime the value of `selectedTab` or `nftBalanceOfUser` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab
  useEffect(() => {
    // if (selectedTab === "View Proposals" && nftBalanceOfUser) {
    //   fetchAllProposals();
    //   }
    const currentNftBalance = nftBalanceOfUser ? parseInt(nftBalanceOfUser.data?.toString()) : null;
  setNftUserBalance(currentNftBalance);
  // Update ref
    // if (nftBalanceOfUser !== undefined && nftBalanceOfUser.data !== undefined) {
      // if (nftBalanceOfUser?.data !== undefined && nftUserBalance === null) {  
      //    setNftUserBalance(parseInt(nftBalanceOfUser.data.toString()));
      // }
      // if (nftBalanceOfUser?.data !== undefined) {
      //   setNftUserBalance(parseInt(nftBalanceOfUser.data.toString()));
      // }
    setIsMounted(true);

    // Only fetch proposals when the tab changes or nftBalance changes
  if (selectedTab === "Ver Propuestas") {
    fetchAllProposals();
  }
}, [selectedTab, nftUserBalance]); // Dependency array

  // Function to make a createProposal transaction in the DAO
  async function createProposal() {
    console.log("Description: ", description);
    if (nftUserBalance === 0 || nftUserBalance === undefined || parseInt(nftBalanceOfUser.data.toString()) === 0) {
      alert("Lo siento, no eres poseedor del NFT y no puedes crear propuestas")
      return;
    }
    setLoading(true);
    
    try {
      const tx = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "createProposal",
        // args: [fakeNftTokenId],
        args: [description],
      });

      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  // Function to fetch a proposal by it's ID

  //CORREGIR*********************
  async function fetchProposalById(id) {
    try {
      const proposal = await readContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "proposals",
        args: [id],
      });

      const [deadline, yayVotes, nayVotes, executed, description] = proposal;

      const parsedProposal = {
        proposalId: id,
        // nftTokenId: nftTokenId.toString(),
        deadline: new Date(parseInt(deadline.toString()) * 1000),
        yayVotes: yayVotes.toString(),
        nayVotes: nayVotes.toString(),
        executed: Boolean(executed),
        description: description.toString(),
      };

      return parsedProposal;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  // Function to fetch all proposals in the DAO
  async function fetchAllProposals() {
    try {
      const proposals = [];

      for (let i = 0; i < numOfProposalsInDAO.data; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }

      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  // Function to vote YAY or NAY on a proposal
  async function voteForProposal(proposalId, vote) {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "voteOnProposal",
        args: [proposalId, vote === "Si" ? 0 : 1],
      });

      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  // Function to execute a proposal after deadline has been exceeded
  async function executeProposal(proposalId) {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "executeProposal",
        args: [proposalId],
      });

      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  // Function to withdraw ether from the DAO contract
  async function withdrawDAOEther() {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: SuperPionerosDAOAddress,
        abi: SuperPionerosDAOABI,
        functionName: "withdrawEther",
        args: [],
      });

      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  // Render the contents of the appropriate tab based on `selectedTab`
  function renderTabs() {
    if (selectedTab === "Crear Propuestas") {
      return renderCreateProposalTab();
    } else if (selectedTab === "Ver Propuestas") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // Renders the 'Create Proposal' tab content
  function renderCreateProposalTab() {
    // console.log("UserBALANCE", nftUserBalance);
    if (nftUserBalance === 0 || nftUserBalance === undefined || parseInt(nftBalanceOfUser.data.toString()) === 0) {
      alert("Los siento, no eres poseedor del NFT y no puedes crear propuestas");
      return null;
    }
    if (loading) {
      return (
        <div className={styles.description}>
          <p>Cargando... Esperando a la transacción...</p>
        </div>
      );
    } else if (nftUserBalance === 0 || nftUserBalance === null || parseInt(nftBalanceOfUser.data.toString()) === 0 || nftBalanceOfUser.data === undefined) {
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
            placeholder="Descripción"
            className={styles.description_input}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          {/* <input
            placeholder="Description"
            type="text"
            onChange={(e) => setDescription(e.target.value)}
          /> */}
          <button className={styles.button2} onClick={createProposal}>
            Crear
          </button>
        </div>
      );
    }
  }

  // Renders the 'View Proposals' tab content
  function renderViewProposalsTab() {
    // console.log("ViewStyles",styles);
    const hasNft = nftUserBalance !== null && nftUserBalance > 0;

    if (loading) {
      return (
        <div className={styles.description}>
         <p>Cargando... Esperando a la transacción...</p> 
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>
          <p>No se han creado propuestas</p>
        </div>
      );
    } else if (!hasNft) {
      return (
        <div  className={styles.description}>
          <p>No posees el NFT SuperPionero. <br />
          <b>No puedes ver o votar propuestas.</b></p>
        </div>
      );
    } else {
      return (
        <div className={styles.porposals_container}>
          <div className={styles.porposals}>
          {proposals.map((p, index) => (
            <div key={index} className={styles.card}>
              <p className={styles.proposalDetail}>Propuesta ID: {p.proposalId}</p>
              {/* <p>Fake NFT to Purchase: {p.nftTokenId}</p> */}
              <p>Descripcion: {p.description}</p>
              <p className={styles.proposalDetail}>Deadline: {p.deadline.toLocaleString()}</p>
              <p className={styles.proposalDetail}>Votos Si: {p.yayVotes}</p>
              <p className={styles.proposalDetail}>Votos No: {p.nayVotes}</p>
              {/* <p>Ejecutada?: {p.executed.toString()}</p>  */}
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteForProposal(p.proposalId, "Si")}
                  >
                    Votar Si
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteForProposal(p.proposalId, "No")}
                  >
                    Votar No
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Ejecutar Propuesta{" "}
                    {p.yayVotes > p.nayVotes ? "(Si)" : "(No)"}
                  </button>
                </div>
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
  //   if (nftBalanceOfUser.data) {
  //     setNftUserBalance(nftBalanceOfUser.data);
  //   }
  //   setIsMounted(true);
  // }, [nftBalanceOfUser.data]);
  

  if (!isMounted) return null;

  if (!isConnected)
    return (
      <div>
        <ConnectButton />
        <div className={styles.initial_container}>
          <img
            className={styles.initial_logo_image}
            src="./SuperPionerosLogo.png"
          />
          <h1 className={styles.initialTitle}>Super Pioneros DAO</h1>
          <p className={styles.initialText}>Conecta tu wallet</p>
          <ConnectButton />
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
          <div className={styles.initialLogo}>
            <img src="./SuperPionerosLogo.png" />
          </div>
          <div className={styles.general_container}>
            <img className={styles.initialImage} src="./superpioneros.png" />
            <h1 className={styles.title}>
              Super Pioneros <br></br> DAO
            </h1>
          </div>

          <div className={styles.image_container}>
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
              {/*Falla esta clase primer_p y el id prueba, no la esta cogiendo*/}
              <p id="prueba" className={styles.primer_p}>
                Eres poseedor de {nftBalanceOfUser.data?.toString()}{" "}
                SuperPioneros NFT{" "}
              </p>
              <p>
                Numero total de Propuestas:{" "}
                {numOfProposalsInDAO?.data.toString()}
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
          {address && address.toLowerCase() === daoOwner.data.toLowerCase() ? (
            <div className={styles.withdraw_button_container}>
              {loading ? (
                <button className={styles.button}>Loading...</button>
              ) : (
                <button className={styles.withdraw_button} onClick={withdrawDAOEther}>
                  Withdraw DAO ETH
                </button>
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
