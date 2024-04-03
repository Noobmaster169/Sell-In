import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback, useMemo } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { generateSigner, transactionBuilder, publicKey, some, percentAmount  } from '@metaplex-foundation/umi';
import { fetchCandyMachine, mintV2, mplCandyMachine, safeFetchCandyGuard } from "@metaplex-foundation/mpl-candy-machine";
import { Metaplex, walletAdapterIdentity, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, CreateCandyMachineInput, DefaultCandyGuardSettings, CandyMachineItem, toDateTime, sol, TransactionBuilder, CreateCandyMachineBuilderContext } from "@metaplex-foundation/js";
//import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplTokenMetadata, createNft, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { Button, Form, Input, Modal, InputNumber } from 'antd';
import * as bs58 from 'bs58';

// These access the environment variables we defined in the .env file
const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');
const candyMachineAddress = publicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID);
const treasury = publicKey(process.env.NEXT_PUBLIC_TREASURY);
const NFT_METADATA = 'https://mfp2m2qzszjbowdjl2vofmto5aq6rtlfilkcqdtx2nskls2gnnsa.arweave.net/YV-mahmWUhdYaV6q4rJu6CHozWVC1CgOd9NkpctGa2Q';
const QUICKNODE_RPC = "https://distinguished-white-silence.solana-devnet.quiknode.pro/991494e34fbd71bdf05259661eeeca1ae31bddc5/"

export const Test: FC = () => {
    // 👇 Update these constant declarations
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    
    const CONFIG = {
        uploadPath: 'uploads/',
        imgFileName: 'image.png',
        imgType: 'image/png',
        imgName: 'QuickNode Pixel',
        description: 'Pixel infrastructure for everyone!',
        attributes: [
            {trait_type: 'Speed', value: 'Quick'},
            {trait_type: 'Type', value: 'Pixelated'},
            {trait_type: 'Background', value: 'QuickNode Blue'}
        ],
        sellerFeeBasisPoints: 500,//500 bp = 5%
        symbol: 'QNPIX',
        creators: [
            {address: wallet.publicKey, share: 100}
        ]
    };
    /*const umi = useMemo(() =>
        createUmi(quicknodeEndpoint)
            .use(walletAdapterIdentity(wallet))
            .use(mplCandyMachine())
            .use(mplTokenMetadata()),
        [wallet, mplCandyMachine, walletAdapterIdentity, mplTokenMetadata, quicknodeEndpoint, createUmi]
    );*/
    const umi:any = ""

    const metaplex = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet))
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: QUICKNODE_RPC,
            timeout: 60000,
        }));
    
    async function uploader(){
        const uri = await umi.uploader.uploadJson({
            name: 'My NFT',
            description: 'This is my NFT',
            image: "https://ivory-vivacious-rooster-272.mypinata.cloud/ipfs/QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png",
          })
        console.log(uri)
        //This Method is Error:
        //InterfaceImplementationMissingError: Tried using UploaderInterface but no implementation of that interface was found. 
        //Make sure an implementation is registered, e.g. via "context.uploader = new MyUploader();".
    }

    async function signNFT(){
        //umi.programs.bind('splToken', 'splToken2022');
        const mint = generateSigner(umi)
        await createNft(umi, {
            mint,
            name: 'My NFT',
            uri: NFT_METADATA,
            sellerFeeBasisPoints: percentAmount(1),
        }).sendAndConfirm(umi)
        console.log(`https://explorer.solana.com/address/${mint.publicKey.toString()}?cluster=devnet`);
        const asset = await fetchDigitalAsset(umi, mint.publicKey);
        //umi.programs.unbind('splToken');
    }

    async function tryMetaplex(){
        console.log("Wallet:", wallet.publicKey.toString());
        const mintAddress = new PublicKey("3KaB1Gwr3wcfkjQs5GR1n4h6BZXihTrfXarRCCfZFdyh")
        console.log("Trying to find NFT at address:", mintAddress)
        
        const nft :any = await metaplex.nfts().findByMint({ mintAddress }, { commitment: "finalized" });
        const imageUrl = nft.json.image;
        console.log(nft);
    }

    async function onClick(){
        tryMetaplex();
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
                    <span>Test </span>
                </button>
            </div>
            <Form.Item
              style={{
                width: '100%',
                flexDirection: 'column',
                paddingTop: 30,
                marginBottom: 4,
                color: "white",
              }}
              label={<h3>Mint to</h3>}
              labelAlign="left"
              colon={false}
            >
              <Input
                placeholder="Address to mint edition to"
              />
            </Form.Item>
        </div>
    );
};