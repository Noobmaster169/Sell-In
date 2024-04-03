import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { none, generateSigner, transactionBuilder, publicKey, some, percentAmount, createGenericFileFromBrowserFile } from '@metaplex-foundation/umi';
import { create, fetchCandyMachine, mintV2, mplCandyMachine, safeFetchCandyGuard, addConfigLines } from "@metaplex-foundation/mpl-candy-machine";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { createNft, TokenStandard, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { clusterApiUrl } from '@solana/web3.js';
import * as bs58 from 'bs58';
//Update for NFT Uploading
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage'


const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');
const NFT_METADATA = 'https://mfp2m2qzszjbowdjl2vofmto5aq6rtlfilkcqdtx2nskls2gnnsa.arweave.net/YV-mahmWUhdYaV6q4rJu6CHozWVC1CgOd9NkpctGa2Q';


export const CreateCollection = ()=> {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    const [file, setFile] = useState("");
    const inputFile = useRef(null);

    const umi = useMemo(() =>
        createUmi(quicknodeEndpoint)
            .use(walletAdapterIdentity(wallet))
            .use(mplCandyMachine())
            .use(mplTokenMetadata()),
        [wallet, mplCandyMachine, walletAdapterIdentity, mplTokenMetadata, quicknodeEndpoint, createUmi]
    );
    //umi.use(nftStorageUploader({ token: 'YOUR_API_TOKEN' })) //What is the API Token?s
    
    async function createCollection(){
        console.log("Creating Collection");
        const creatorA = generateSigner(umi).publicKey
        /*const candyMachineSettings = {
            tokenStandard: TokenStandard.NonFungible,
            sellerFeeBasisPoints: percentAmount(33.3, 2),
            symbol: 'MYPROJECT',
            maxEditionSupply: 0,
            isMutable: true,
            creators: [
                { address: creatorA, percentageShare: 100, verified: false },
            ],
        }*/
        // Create the Collection NFT.
        const collectionUpdateAuthority = generateSigner(umi)
        const collectionMint = generateSigner(umi)
        await createNft(umi, {
            mint: collectionMint,
            authority: collectionUpdateAuthority,
            name: 'My Collection NFT',
            uri: NFT_METADATA,
            sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
            isCollection: true,
        }).sendAndConfirm(umi)

        // Pass the collection address and its authority in the settings.
        const candyMachineSettings = {
            collectionMint: collectionMint.publicKey,
            collectionUpdateAuthority,
        }
        console.log("Success");
    }
    

    async function candySettings(){
        console.log("Running Candy Settings");
        const candyMachineSettings = {
            configLineSettings: none(),
            hiddenSettings: some({
              name: 'My 1000 FUCKING PROJECT',
              uri: NFT_METADATA,
              hash: hashOfTheFileThatMapsUris,
            }),
          }
    }

    
    async function onClick(){
        // Create Collextion
        const collectionMint = generateSigner(umi)
        await createNft(umi, {
            mint: collectionMint,
            authority: umi.identity,
            name: 'My Collection NFT',
            //uri: NFT_METADATA,
            uri:"https://ivory-vivacious-rooster-272.mypinata.cloud/ipfs/QmbX9si1Ebvz1jmUP9V5ngoUgW1vZcejZPsPXViQXEWikf/0.json",
            sellerFeeBasisPoints: percentAmount(5, 2), //5%
            isCollection: true,
        }).sendAndConfirm(umi)       
        console.log("Collection Successfully Created")
        console.log("Public Key:", collectionMint.publicKey)
        console.log(`https://explorer.solana.com/address/${collectionMint.publicKey.toString()}?cluster=devnet`);

        // Create the Candy Machine.        
        console.log("Creating Candy Machine")
        const candyMachine = generateSigner(umi)
        await create(umi, {
            candyMachine,
            collectionMint: collectionMint.publicKey, //Refer to the preciously created Collection
            collectionUpdateAuthority: umi.identity,
            tokenStandard: TokenStandard.NonFungible,
            sellerFeeBasisPoints: percentAmount(5, 2), //5%
            itemsAvailable: 5000,
            creators: [
                {
                address: umi.identity.publicKey,
                verified: true,
                percentageShare: 100,
                },
            ],
            configLineSettings: some({
                prefixName: '',
                nameLength: 32,
                prefixUri: '',
                uriLength: 200,
                isSequential: false,
            }),
        })//.sendAndConfirm(umi); //Will This Cause An Error?
        console.log("Candy Machine Created")
        console.log(`https://explorer.solana.com/address/${candyMachine.publicKey.toString()}?cluster=devnet`);
        console.log(candyMachine.publicKey)
        //console.log(candyMachine.)

        const machine = await fetchCandyMachine(umi, candyMachine.publicKey, { commitment: "finalized" });
        console.log("Candy Machine Fetched")
        //const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority)

        console.log("Inserting Items");
        await addConfigLines(umi, {
            candyMachine: candyMachine.publicKey,
            index: 0,
            configLines: [
              { name: 'My NFT #1', uri: NFT_METADATA },
              { name: 'My NFT #2', uri: NFT_METADATA },
            ],
        }).sendAndConfirm(umi)        
        console.log("NFT Metadata Successfully Added");
        await addConfigLines(umi, {
            candyMachine: candyMachine.publicKey,
            index: 1,
            configLines: [{ name: 'My NFT #X', uri: 'https://example.com/nftX.json' }],
          }).sendAndConfirm(umi)
        console.log("NFT Metadata Change Successful");

        /*const machine = await fetchCandyMachine(candyMachine.publicKey) //Error: Required 2 parameters
        console.log(candyMachine.items[0].name) // "My NFT #1"
        console.log(candyMachine.items[1].name) // "My NFT #X"*/

        /*Mint NFT
        const nftMint = generateSigner(umi)
        await transactionBuilder()
        .add(setComputeUnitLimit(umi, { units: 800_000 }))
        .add(
            mintV2(umi, {
            candyMachine: candyMachine.publicKey,
            nftMint,
            collectionMint: collectionMint.publicKey,
            collectionUpdateAuthority: collectionMint.metadata.updateAuthority,
            tokenStandard: candyMachine.tokenStandard,
            })
        )
        .sendAndConfirm(umi)*/
    }


    async function handleChange(e){
        setFile(e.target.files[0]);
    }

    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={onClick}
                >
                    <span>Create NFT Collection</span>
                </button>
            </div>
            <input type="file" id="file" ref={inputFile} onChange={handleChange} />
            <img src={file}/>
        </div>

    );
}






// NOTES
/*
// Updating Candy Mahine Settings
const candyMachine = await fetchCandyMachine(umi, candyMachineAddress)
await updateCandyMachine(umi, {
    candyMachine: candyMachine.publicKey,
    data: {
        ...candyMachine.data,
        symbol: 'NEW',                                                              //Change Symbol to 'NEW'
        sellerFeeBasisPoints: percentAmount(5.5, 2),                                //Change Fee to 5.5%
        creators: [{ address: newCreator, verified: false, percentageShare: 100 }], //Change NFT Creator (the one who get shared percentage)
    },
}).sendAndConfirm(umi)

// Upload the JSON metadata.
console.log("Uploading Metadata")
const uri = await umi.uploader.uploadJson({
    name: 'My NFT #1',
    description: 'My description',
    image: fileUri,
})
console.log("Successful")
console.log(uri);

*/



