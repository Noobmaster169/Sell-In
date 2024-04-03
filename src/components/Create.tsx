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
const NFT_METADATA = 'https://mfp2m2qzszjbowdjl2vofmto5aq6rtlfilkcqdtx2nskls2gnnsa.arweave.net/YV-mahmWUhdYaV6q4rJu6CHozWVC1CgOd9NkpctGa2Q';


export const Create = ()=> {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    const [candyMachineAddress, setCandyMachineAddress] = useState("");
    const [collectionLength, setCollectionLength] = useState(0);
    const [gallery, setGallery] = useState(null);
    const [NFTAddress, setNFTAddress] = useState([]);
    const [NFTLinks, setNFTLinks] = useState([]);

    //Trigger The useEffect
    const [triggerEffect, setTriggerEffect] = useState(false);

    //Uploading
    const [files, setFiles] = useState<File[]>([]);
    const [attributes, setAttributes] = useState<{}>({
      name: '',
      symbol: '',
      description: '',
      external_url: '',
      image: '',
      animation_url: undefined,
      attributes: undefined,
      seller_fee_basis_points: 0,
      creators: [],
      properties: {
        files: []
      },
    });

    const METAPLEX = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet))
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: quicknodeEndpoint,
            timeout: 60000,
        }));
    
    useEffect(()=>{
        console.log("Running Use Effect")
        console.log("Adding NFTs to Gallery");
        console.log("Addresses:", NFTAddress)
        //createGallery();        
    }, [])

    async function createGallery(){
        setTriggerEffect(prevState => !prevState);
        const NFTImages = []
        NFTAddress.forEach(async (mintAddress)=>{
            const NFTImageURL = await find_nft(mintAddress)
            console.log("Creating HTML Object of NFT:", NFTImageURL)
            NFTImages.push(
                <div>
                    <h1>Image:</h1>
                    <img src={NFTImageURL} />
                </div>
            )
            NFTLinks.push(NFTImageURL)
        })
        console.log(NFTImages);
        setGallery(NFTImages);
        console.log("Successful")
    }
    
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
        
            setNFTAddress([...NFTAddress, nft.address.toString()]);
            console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
            console.log(`     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`);
            console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
            notify({ type: 'success', message: 'NFT Minted!', txid: response.signature });
            setTriggerEffect(prevState => !prevState);
        
        }catch (error: any) {
            notify({ type: 'error', message: `Minting Process Failed!`, description: error?.message});
            console.log('error', `Minting Process Failed! ${error?.message}`);
            return;
        }
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

    async function uploadToIpfs(){
        console.log("Uploading File to IPFS");
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
                    onClick={createGallery}
                >
                    <span>Display NFTs</span>
                </button>
            </div>
        </div>
        <UploadStep
              attributes={attributes}
              setAttributes={setAttributes}
              files={files}
              setFiles={setFiles}
              confirm={() => uploadToIpfs()}
            />
        </>
    );
}


const UploadStep1 = () =>{
    const {Dragger} = Upload;
    const [coverFile, setCoverFile] = useState(null)

    return(
        <div style={{color: "blue !important"}}className="flex flex-row justify-center">
            <Dragger
            accept=".png,.jpg,.gif,.mp4,.svg"
            style={{ padding: 20 , color:"red !important"}}
            fileList={coverFile ? [coverFile as any] : []}
            onChange={async info => {
                const file = info.file.originFileObj;
                if (file) setCoverFile(file);
            }} 
            multiple={false}
            customRequest={info => {
                // dont upload files here, handled outside of the control
                info?.onSuccess?.({}, null as any);
            }}
            >
            <div className="ant-upload-drag-icon">
                <h3 style={{ fontWeight: 700, color:"red"}}>
                Upload your cover image (PNG, JPG, GIF, SVG)
                </h3>
            </div>
            <p style={{color:"red"}} className="ant-upload-text">Drag and drop, or click to browse</p>
            </Dragger>
        </div>
    )
}

const UploadStep = (props: {
    attributes: any;
    setAttributes: (attr: any) => void;
    files: File[];
    setFiles: (files: File[]) => void;
    confirm: () => void;
  }) => {
    const [coverFile, setCoverFile] = useState<File | undefined>(
      props.files?.[0],
    );
    const [mainFile, setMainFile] = useState<File | undefined>(props.files?.[1]);
  
    const [customURL, setCustomURL] = useState<string>('');
    const [customURLErr, setCustomURLErr] = useState<string>('');
    const disableContinue = !coverFile || !!customURLErr;

    const { Step } = Steps;
    const { Dragger } = Upload;
    const { Text } = Typography;
  
    useEffect(() => {
      props.setAttributes({
        ...props.attributes,
        properties: {
          ...props.attributes.properties,
          files: [],
        },
      });
    }, []);  
    
    return (
      <>
        <Row className="call-to-action">
          <h2>Now, let's upload your creation</h2>
          <p style={{ fontSize: '1.2rem' }}>
            Your file will be uploaded to the decentralized web via Arweave.
            Depending on file type, can take up to 1 minute. Arweave is a new type
            of storage that backs data with sustainable and perpetual endowments,
            allowing users and developers to truly store data forever – for the
            very first time.
          </p>
        </Row>
        <Row className="content-action">
          <h3>Upload a cover image (PNG, JPG, GIF, SVG)</h3>
          <Dragger
            accept=".png,.jpg,.gif,.mp4,.svg"
            style={{ padding: 20, color:"white"}}
            multiple={false}
            customRequest={info => {
              // dont upload files here, handled outside of the control
              info?.onSuccess?.({}, null as any);
            }}
            fileList={coverFile ? [coverFile as any] : []}
            onChange={async info => {
              const file = info.file.originFileObj;
              if (file) setCoverFile(file);
            }}
          >
            <div className="ant-upload-drag-icon">
              <h3 style={{ fontWeight: 700 }}>
                Upload your cover image (PNG, JPG, GIF, SVG)
              </h3>
            </div>
            <p className="ant-upload-text">Drag and drop, or click to browse</p>
          </Dragger>
        </Row>
        <Row
        className="content-action"
        style={{ marginBottom: 5, marginTop: 30 }}
        >
        <Dragger
            accept={'.png,.jpg,.gif'}
            style={{ padding: 20, background: 'rgba(255, 255, 255, 0.08)' }}
            multiple={false}
            customRequest={info => {
            // dont upload files here, handled outside of the control
            info?.onSuccess?.({}, null as any);
            }}
            fileList={mainFile ? [mainFile as any] : []}
            onChange={async info => {
            const file = info.file.originFileObj;

            // Reset image URL
            setCustomURL('');
            setCustomURLErr('');

            if (file) setMainFile(file);
            }}
            onRemove={() => {
            setMainFile(undefined);
            }}
        >
            <div className="ant-upload-drag-icon">
            <h3 style={{ fontWeight: 700 }}>Upload your creation</h3>
            </div>
            <p className="ant-upload-text">Drag and drop, or click to browse</p>
        </Dragger>
        </Row>
        <Form.Item
          style={{
            width: '100%',
            flexDirection: 'column',
            paddingTop: 30,
            marginBottom: 4,
          }}
          label={<h3>OR use absolute URL to content</h3>}
          labelAlign="left"
          colon={false}
          validateStatus={customURLErr ? 'error' : 'success'}
          help={customURLErr}
        >
          <Input
            disabled={!!mainFile}
            placeholder="http://example.com/path/to/image"
            value={customURL}
            onChange={ev => setCustomURL(ev.target.value)}
            onFocus={() => setCustomURLErr('')}
            onBlur={() => {
              if (!customURL) {
                setCustomURLErr('');
                return;
              }
  
              try {
                // Validate URL and save
                new URL(customURL);
                setCustomURL(customURL);
                setCustomURLErr('');
              } catch (e) {
                console.error(e);
                setCustomURLErr('Please enter a valid absolute URL');
              }
            }}
          />
        </Form.Item>
        <Row>
          <Button
            type="primary"
            size="large"
            disabled={disableContinue}
            style={{ marginTop: 24 }}
            className="action-btn"
          >
            Continue to Mint
          </Button>
        </Row>
      </>
    );
  };