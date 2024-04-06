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
import {
    Steps,
    Row,
    Button,
    Upload,
    Col,
    Input,
    Statistic,
    Slider,
    Progress,
    Spin,
    InputNumber,
    Form,
    Typography,
    Space,
  } from 'antd';
//Update for NFT Uploading
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage'


const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');
const NFT_METADATA = 'https://ivory-vivacious-rooster-272.mypinata.cloud/ipfs/QmNxyW1emS1ER3GcLvSykp6ApEDL2nvSes7ZmniUAdp9Z8';


export const Create = ()=> {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    const [candyMachineAddress, setCandyMachineAddress] = useState("");

    const METAPLEX = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet))
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: quicknodeEndpoint,
            timeout: 60000,
        }));
    
    async function createCollection() {
        if (!wallet.publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Wallet not connected!`);
            return;
        }
        const { nft: collectionNft } = await METAPLEX.nfts().create({
            name: "NFT Title",
            uri: NFT_METADATA,
            sellerFeeBasisPoints: 0,
            isCollection: true,
            updateAuthority: wallet,
        });
        console.log(`✅ - Minted Collection NFT: ${collectionNft.address.toString()}`);
        console.log(`     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`);
        return collectionNft.address.toString();
    }

    async function generateCandyMachine(collectionAddress) {
        if (!wallet.publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Wallet not connected!`);
            return;
        }
        console.log("Generating Candy Machine")
        try{
            const candyMachineSettings: CreateCandyMachineInput<DefaultCandyGuardSettings> =
                {
                    itemsAvailable: toBigNumber(3), // Collection Size: 3
                    sellerFeeBasisPoints: 1000, // 10% Royalties on Collection
                    symbol: "DEMO",
                    maxEditionSupply: toBigNumber(0), // 0 reproductions of each NFT allowed
                    isMutable: true,
                    creators: [
                        { address: wallet.publicKey, share: 100 },
                    ],
                    collection: {
                        address: new PublicKey(collectionAddress), // Can replace with your own NFT or upload a new one
                        updateAuthority: wallet,
                    },
                    guards: {
                        startDate: { date: toDateTime("2024-03-30T16:00:00Z") },
                        mintLimit: {
                            id: 1,
                            limit: 2,
                        },
                        solPayment: {
                            amount: sol(0.1),
                            destination: METAPLEX.identity().publicKey,
                        },
                    }
                };
            const { candyMachine } = await METAPLEX.candyMachines().create(candyMachineSettings);
            console.log(`✅ - Created Candy Machine: ${candyMachine.address.toString()}`);
            console.log(`     https://explorer.solana.com/address/${candyMachine.address.toString()}?cluster=devnet`);
            setCandyMachineAddress(candyMachine.address.toString());
            notify({ type: 'success', message: 'NFT Collection Successfully Created'});

        }catch (error: any) {
            notify({ type: 'error', message: `Fail To Generate Candy Machine!`, description: error?.message});
            console.log('error', `Fail To Generate Candy Machine! ${error?.message}`);
            return;
        }
    }
    
    async function addNFT() {
        if (!wallet.publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Wallet not connected!`);
            return;
        }
        try{
            const candyMachine = await METAPLEX
                .candyMachines()
                .findByAddress({ address: new PublicKey(candyMachineAddress) });
            console.log("Adding NFTs to candy machine", candyMachine.address.toString())
            const items = [];
            for (let i = 0; i < 3; i++ ) { // Add 3 NFTs to Collection
                items.push({
                    name: `QuickNode Demo NFT # ${i+1}`,
                    uri : NFT_METADATA
                })
            }
            console.log(items);
            const { response } = await METAPLEX.candyMachines().insertItems({
                candyMachine,
                items: items,
            });
        
            console.log(`✅ - Items added to Candy Machine: ${candyMachineAddress}`);
            console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
            notify({ type: 'success', message: 'New Item Added To Collection!', txid: response.signature });

        }catch (error: any) {
            notify({ type: 'error', message: `Fail To Add Item to NFT Collection!`, description: error?.message});
            console.log('error', `Fail To Add Item to NFT Collection! ${error?.message}`);
            return;
        }
    }

    async function mintNFT() {
        if (!wallet.publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Wallet not connected!`);
            return;
        }
        try{
            const candyMachine = await METAPLEX
                .candyMachines()
                .findByAddress({ address: new PublicKey(candyMachineAddress) }); 
            const { nft, response } = await METAPLEX.candyMachines().mint({
                candyMachine,
                collectionUpdateAuthority: wallet.publicKey,
                },{commitment:'finalized'})
        
            console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
            console.log(`     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`);
            console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
            notify({ type: 'success', message: 'NFT Minted!', txid: response.signature });
        
        }catch (error: any) {
            notify({ type: 'error', message: `Minting Process Failed!`, description: error?.message});
            console.log('error', `Minting Process Failed! ${error?.message}`);
            return;
        }
    }
    async function noCollectionMint(){
        const { nft } = await METAPLEX
        .nfts()
        .create({
            //uri: metadataUri,
            uri: "https://arweave.net/qLMPHJDcvglkNfHQSUBjEsLnzl0tFeyPOF2KxxgkUUc",
            name: "NFT Title",
            sellerFeeBasisPoints: 100,
            symbol: "LFG100x",
            creators: [
                {address: wallet.publicKey, share: 100}
            ],
            isMutable: true,
        }, { commitment: "finalized" });
        console.log(`   Success!🎉`);
        console.log(`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
    }

    const find_nft = async (mintKey : PublicKey) =>{
        const mintAddress = new PublicKey(mintKey); 
        console.log("Trying to find NFT at address:", mintAddress.toString())
        //const address= new PublicKey("5kDn5PMWyDSZrg9jvRYRSFGuteB2egfRYRgpYk1BJBNH")
        const nft :any = await METAPLEX.nfts().findByMint({ mintAddress }, { commitment: "finalized" });
        const imageUrl = nft.json.image;
        console.log(nft);
        console.log("Image:", imageUrl);
        return imageUrl;
    }

    async function  createNFTCollection(){
        console.log("Creating NFT Collection")
        const collection = await createCollection();
        if(collection){
            generateCandyMachine(collection);
        }
    }

    return (
       <> <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={createNFTCollection}
                >
                    <span>Create Collection</span>
                </button>
            </div>
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={addNFT}
                >
                    <span>Add NFTs</span>
                </button>
            </div>
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={mintNFT}
                >
                    <span>Mint NFTs</span>
                </button>
            </div>
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={noCollectionMint}
                >
                    <span>No Collection Mint</span>
                </button>
            </div>
        </div>
        </>
    );
}
