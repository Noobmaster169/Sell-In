import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback, useMemo, useState, useEffect } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { generateSigner, transactionBuilder, publicKey, some, percentAmount  } from '@metaplex-foundation/umi';
import { fetchCandyMachine, mintV2, mplCandyMachine, safeFetchCandyGuard } from "@metaplex-foundation/mpl-candy-machine";
import { Metaplex, walletAdapterIdentity, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, CreateCandyMachineInput, DefaultCandyGuardSettings, CandyMachineItem, toDateTime, sol, TransactionBuilder, CreateCandyMachineBuilderContext } from "@metaplex-foundation/js";
//import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplTokenMetadata, createNft, fetchDigitalAsset, collect } from '@metaplex-foundation/mpl-token-metadata';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';
//Update for NFT Uploading
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage'


const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');

export const Gallery = ()=> {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    
    const [gallery, setGallery] = useState(null);
    const NFTAddress= ["4LRjBTy1WPoKo3fEUM4d2DdeR1SMAKoXCPRbGvDeYKEG"];

    const METAPLEX = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet))
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: quicknodeEndpoint,
            timeout: 60000,
        }));

    useEffect(() =>{
        async function searchNFT(){
            const NFTDisplays: JSX.Element[] = [];
            NFTDisplays.push(<h1>Testing</h1>);

            for (const address of NFTAddress) {
                const mintAddress = new PublicKey(address);
            
                console.log("Searching for NFT:", address);
                const nft: any = await METAPLEX.nfts().findByMint({ mintAddress }, { commitment: "finalized" });
                console.log("NFT Found");
                const imageUrl = nft.json.image;
        
                NFTDisplays.push(<img width="300" height="300" src={imageUrl} />);
              }
            NFTDisplays.push(<h1>End</h1>);
            setGallery(NFTDisplays)
        }
        searchNFT();
    }, []);

    return(
        <div className="flex flex-row justify-center">
            {gallery ? gallery : "No NFT Detected"}
        </div>
    )
}