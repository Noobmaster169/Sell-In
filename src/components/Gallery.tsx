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
import sellinLogo from '../../public/solanaLogo.png';
import styled from 'styled-components';
import { useRouter } from 'next/router';

const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');

const GallerySection = styled.div`
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
`

const GalleryCard = styled.div`
    width: 220px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
    margin: 15px;
` 
const Cardinformation = styled.div`
    padding: 5px 15px;
    margin-bottom: 5px;
`
const CardTitle = styled.div`
    font-size: 20px;
`
const CardPrice = styled.div`
    color: #50fa7b;
`

const TitleContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 40px;
`
const GalleryTitle = styled.div`
    color: white;
    font-size: 40px;
    font-weight: bold;
    font-family: Arial, sans-serif;
    border-bottom: 3px solid white;
    margin-bottom: 20px;
`

export const Gallery = ()=> {
    const { connection } = useConnection();
    const wallet = useWallet();
    const route = useRouter();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    
    const [gallery, setGallery] = useState(null);
    const NFTAddress= [
        "Ariq1YVsi6zqQb7dU3xjFUFyoaHwUvhtfKVrEa5ZEt5A",
        "953EiExPMGpdJn3kSNxfyjz3jM2VMXSr1EBkuJCCVqCU",
        "ELkup3zAMfqwoECRcrKwtGD92Na5tw29p3uqC7aUtrGf",
        "3cVo3EJRGf6ZMyKYbJqyKho6BN7z6YqzpA2RncvM4ZE7",
        "8zzLQdqnKeBdb65dQzESNbTsBGdf7cudgt4psCUMaVyu"
    ];

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
            for (const address of NFTAddress) {
                
                const mintAddress = new PublicKey(address);
            
                console.log("Searching for NFT:", address);
                const nft: any = await METAPLEX.nfts().findByMint({ mintAddress }, { commitment: "finalized" });
                console.log("NFT Found");
                const imageUrl = nft.json.image;
                
                NFTDisplays.push(
                    <GalleryCard onClick={() => {route.push(`/nft/${address}`)}}>
                        <img width="300" height="300" src={ nft.json.image} />
                        <Cardinformation>
                            <CardTitle>{nft.json.name}</CardTitle>
                            <CardPrice>NOT LISTED</CardPrice>
                        </Cardinformation>
                    </GalleryCard>
                )
                
                //NFTDisplays.push(<img width="300" height="300" src={imageUrl} />);
              }
            setGallery(NFTDisplays)
        }
        searchNFT();
    }, []);

    return(
        <>
        <TitleContainer>
            <GalleryTitle>
                Featured NFTs:
            </GalleryTitle>
        </TitleContainer>
        <div className="flex flex-row justify-center">
            {gallery ? gallery : "No NFT Detected"}
        </div>
        </>
    )
}