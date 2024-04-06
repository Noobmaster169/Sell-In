import React, { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
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
  ConfigProvider,
} from 'antd';
import styled from 'styled-components';
import { FileAddOutlined } from '@ant-design/icons';
import { json } from 'stream/consumers';
import { notify } from "../utils/notifications";
import NavElement from './nav-element';
import AES from 'crypto-js/aes';
import { uploadEncryptedFile, uploadPublicFile, uploadJSON } from '../utils/ipfs';
import { Metaplex, walletAdapterIdentity, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, toDateTime, sol, TransactionBuilder} from "@metaplex-foundation/js";
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { useRouter } from 'next/router';


const MintStep = styled.div`
    font-family: Arial, sans-serif;
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 10px;
`
const MintInstruction = styled.div`
    align-self: flex-start !important
    text-align: left !important;
    margin-top: 15px;
    margin-bottom: 4px;
`
const ButtonContainer = styled.div`
    width:100%;
    text-align:center;
`

const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');

export const Mint = ()=> {
    const { connection } = useConnection();
    const wallet = useWallet();
    const route = useRouter();
    const METAPLEX = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet))
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: quicknodeEndpoint,
            timeout: 60000,
        }));
    
    const { innerWidth: width, innerHeight: height } = window;
    const [step, setStep] = useState<number>(0);
    const [publicMetadata, setPublicMetadata] = useState(null);
    const [privateMetadata, setPrivateMetadata] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [jsonMetadata, setJsonMetadata] = useState({
        image: '',
        name: '',
        symbol: '',
        description: '',
        category: '',
        privateMetadata: '',
        sellerFeeBasisPoints: 0,
        isMutable: true,
        creators: [],
        properties: [],
    })
    const [encryptedData, setEncryptedData] = useState(null);
    const [publicIpfs, setPublicIpfs] = useState(null);
    const [properties, setProperties] = useState(null);
    const [cid, setCid] = useState('');
    const [uploading, setUploading] = useState(false);

    const MintSection = styled.div`
        border-radius:1rem;
        background-color: #333333;
        color: white;
    `;

    const Step = styled.div`
        color:white;
    `
    const goToStep = (nextStep) => {
        setStep(nextStep);
    }

    const encryptData = async () =>{
        return new Promise((resolve, reject) => {
            let encryptedCid = "empty";
            var reader = new FileReader();
            reader.readAsDataURL(privateMetadata);
            reader.onload = async function () {
                try {
                    var cipher = await AES.encrypt(reader.result, 'your-secret-key').toString(); 
                    console.log("Encryption Result:", cipher);
                    setEncryptedData(cipher);
                    console.log("Encrypted Data Updated");
                    encryptedCid = await uploadEncryptedFile(cipher);
                    
                    await setJsonMetadata(prevMetadata => ({
                        ...prevMetadata,
                        privateMetadata: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${encryptedCid}`,
                        properties: [
                            {type: "encrypted", uri: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${encryptedCid}`}
                        ] 
                    }));
                    console.log("Properties Updated")
                    resolve(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${encryptedCid}`); // Resolve the Promise with the encrypted CID
                } catch (error) {
                    reject(error); // Reject the Promise if an error occurs
                }
            };
        });
    };

    const mintNFT = async () =>{    
        //await uploadFile();
        console.log("Minting:", jsonMetadata);
        const metadataUri = await uploadMetadata();
        await makeTransaction(metadataUri);
    }
    
    const uploadFile = async () =>{
        const encryptedUri = await encryptData();
        console.log("Successfully Encrypting File:", encryptedUri);
        
        const publicCid = await uploadPublicFile(publicMetadata);
        const publicUri = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${publicCid}`
        console.log("Public Display:", publicUri);
        
        await setJsonMetadata(prevMetadata => ({
            ...prevMetadata,
            image: publicUri,
            creators:[
                {address: wallet.publicKey, share: 100}
            ]
        }));
        console.log("Image and Creator Updated")
        setUploading(false);
    }

    const uploadMetadata = async () =>{
        console.log("JSON Metadata:", jsonMetadata)
        const nftMetadata = {
            name: jsonMetadata.name,
            image: jsonMetadata.image,
            description: jsonMetadata.description,
            category: jsonMetadata.category,
            privateMetadata: jsonMetadata.privateMetadata,
            properties: jsonMetadata.properties,
        }
        console.log("NFT Metadata:", JSON.stringify(nftMetadata));
        const metadataCid = await uploadJSON(nftMetadata);
        const metadataUri = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${metadataCid}`
        console.log("Metadata URL:", metadataUri);
        return metadataUri
    }

    const makeTransaction = async (uri) =>{
        try {
            const { nft } = await METAPLEX
            .nfts()
            .create({
                uri: uri,
                name: jsonMetadata.name,
                sellerFeeBasisPoints: jsonMetadata.sellerFeeBasisPoints,
                symbol: jsonMetadata.symbol,
                creators: [{address: wallet.publicKey, share: 100}],
                isMutable: true,
            }, { commitment: "finalized" });
            console.log(`   Success!🎉`);
            console.log(`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
            setCid(nft.address.toString());
        } catch (error: any) {
            notify({ type: 'error', message: `Minting failed!`, description: error?.message });
            console.log('error', `Minting failed! ${error?.message}`);
            route.push(`/`);
            return;
        }
    }

    const temp = () =>{console.log(jsonMetadata)}
    
    return(<>
        <div className="flex flex-row justify-center w-100">
        <ConfigProvider
            theme={{
                components: {
                    Steps: {
                        colorText: 'white',
                        colorSplit: 'white',
                        colorTextDescription:'white',
                        colorTextDisabled:'white'
                    },
                },
            }}
        >
            <MintSection className="w-100 p-6 px-10 my-2">
                <Col style={{color:"white", margin:"10px"}}>
                    <Steps
                        progressDot
                        direction={'horizontal'}
                        current={step}
                        style={{
                            width: 'fit-content',
                            margin: '0 auto 30px auto',
                            padding: '5px',
                            overflowX: 'auto',
                            maxWidth: '100%',
                            color: 'white !important'
                        }}
                    >
                    <Step title="Create"></Step>
                    <Step title="Upload" />
                    <Step title="Royalties" />
                    <Step title="Mint" />
                    <Step title="Completed" />
                    </Steps>
                </Col>
                {step === 0 && (
                    <CreateSection
                        confirm={()=> goToStep(1)}
                        jsonMetadata = {jsonMetadata}
                        setJsonMetadata = {setJsonMetadata}
                    />
                )}
                {step === 1 && (
                    <UploadSection 
                        publicMetadata = {publicMetadata}
                        setPublicMetadata = {setPublicMetadata}
                        privateMetadata = {privateMetadata}
                        setPrivateMetadata = {setPrivateMetadata}
                        setImageUrl = {setImageUrl}
                        confirm = {() => goToStep(2)}
                        back = {() => goToStep(0)}
                    />
                )}
                {step === 2 && (
                    <RoyaltySection
                        confirm={async()=> {goToStep(3); setUploading(true); uploadFile();}}
                        back = {() => goToStep(1)}
                        jsonMetadata = {jsonMetadata}
                        setJsonMetadata = {setJsonMetadata}
                    />
                )}
                {step === 3 && (
                    <ConfirmSection
                        confirm={()=> goToStep(4)}
                        back = {() => goToStep(2)}
                        mintNFT= {() => mintNFT()}
                        publicMetadata = {publicMetadata}
                        privateMetadata= {privateMetadata}
                        jsonMetadata = {jsonMetadata}
                        imageUrl = {imageUrl}
                        uploading = {uploading}
                    />
                )}
                {step === 4 && (
                    <CompletedSection
                        cid = {cid}
                    />
                )}
            </MintSection>
        </ConfigProvider>
        </div>
    </>)
}


const UploadSection = (props: {
    publicMetadata;
    setPublicMetadata; 
    privateMetadata; 
    setPrivateMetadata; 
    setImageUrl;
    confirm: () => void;
    back: () => void;
}) =>{
    const [publicInput, setPublicInput] = useState(null);
    const [privateInput, setPrivateInput] = useState(null);
    
    const submitData = async () =>{
        console.log("Submitting Data")
        if(!(publicInput && privateInput)){
            alert("Please Input Both Public & Private Metadata To Continue");
            return;
        }
        props.setImageUrl(URL.createObjectURL(publicInput));
        props.setPublicMetadata(publicInput);
        props.setPrivateMetadata(privateInput);
        console.log("File Data Submitted");
        props.confirm();
    }
    
    return(
    <>
        <div className='justify-content-center align-items-center white'>
            <MintStep>Step 2: Upload Metadata</MintStep>
            <MintInstruction>Upload Public Metadata:</MintInstruction>
            <Upload.Dragger
                accept=".png,.jpg,.gif,.svg"
                style={{ display:'flex', justifyContent:'center', padding: 20, color:"white", width:"100%"}}
                fileList={publicInput ? [publicInput as any] : []}
                onChange={
                info =>{
                    setPublicInput(info.file.originFileObj); 
                }
                }
                multiple={false}
            >
                <FileAddOutlined className="mb-3" style={{ fontSize: '40px'}}/>
                <div className="ant-upload-drag-icon">
                <h3 style={{ fontWeight: 700 }}>
                    Upload Public Metadata (PNG, JPG, GIF, SVG)
                </h3>
                </div>
                <p className="ant-upload-text">
                Drag and drop, or click to browse
                </p>
            </Upload.Dragger>
            
            <MintInstruction>Upload Private Metadata:</MintInstruction>
            <Upload.Dragger
                //accept=".png,.jpg,.gif,.svg"
                style={{ display:'flex', justifyContent:'center', padding: 20, color:"white", width:"100%"}}
                fileList={privateInput ? [privateInput as any] : []}
                onChange={
                info =>{
                    setPrivateInput(info.file.originFileObj); 
                }
                }
                multiple={false}
            >
                <FileAddOutlined className="mb-3" style={{ fontSize: '40px'}}/>
                <div className="ant-upload-drag-icon">
                <h3 style={{ fontWeight: 700 }}>
                    Upload Private Metadata
                </h3>
                </div>
                <p className="ant-upload-text">
                Drag and drop, or click to browse
                </p>
            </Upload.Dragger>
            <ButtonContainer>
                <Button
                    type="primary"
                    size="large"
                    className="action-btn mt-5"
                    style={{backgroundColor:"#4096ff", margin:"10px"}}
                    onClick={() => {props.back();}}
                >
                    Back
                </Button>
                <Button
                    type="primary"
                    size="large"
                    className="action-btn mt-5"
                    style={{backgroundColor:"#4096ff"}}
                    onClick={submitData}
                >
                    Next
                </Button>
            </ButtonContainer>
        </div>
    </>
    )
}

const CreateSection = (props:{
    confirm: () => void;
    jsonMetadata;
    setJsonMetadata;
}) =>{
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');

    const submitData = async () =>{
        props.setJsonMetadata(prevMetadata => ({
            ...prevMetadata,
            name: name,
            symbol: symbol,
            description: description,
            category: category
        }));
        props.confirm();
    }
    return(
        <>
        <div className='justify-content-center align-items-center white'>
            <MintStep>Step 1: Add Your NFT Data</MintStep>
            <MintInstruction>NFT Name:</MintInstruction>
                <Input
                    placeholder="NFT Name"
                    value={name}
                    onChange={info => setName(info.target.value)}
                />
            <MintInstruction>NFT Symbol:</MintInstruction>
                <Input
                    placeholder="NFT Symbol"
                    value={symbol}
                    onChange={info => setSymbol(info.target.value)}
                />
            <MintInstruction>NFT Description:</MintInstruction>
                <Input
                    placeholder="NFT Description"
                    value={description}
                    onChange={info => setDescription(info.target.value)}
                />
            <MintInstruction>Data Category:</MintInstruction>
                <Input
                    placeholder="NFT Category"
                    value={category}
                    onChange={info => setCategory(info.target.value)}
                />
            <ButtonContainer>
                <Button
                    type="primary"
                    size="large"
                    className="action-btn mt-5"
                    style={{backgroundColor:"#4096ff", margin:"10px"}}
                    onClick={submitData}
                >
                    Next
                </Button>
            </ButtonContainer>
        </div>
    </>
    )
}

const RoyaltySection = (props:{
    confirm: () => void;
    back: () => void;
    jsonMetadata;
    setJsonMetadata;
}) =>{
    const [royalty, setRoyalty] = useState<number>(0);

    const submitData = async () =>{
        if(royalty<0 || royalty>50){
            notify({ type: 'error', message: `Royalty Must Be Between 1-50% !` });
            console.log('error', `Royalty Must Be Between 1-50% !`);
            return;
        }
        console.log("Updating Royalty to:", royalty)
        props.setJsonMetadata(prevMetadata => ({
            ...prevMetadata,
            sellerFeeBasisPoints: royalty * 100,
        }));
        props.confirm();
    }


    return(
        <>
        <div className='justify-content-center align-items-center white'>
            <MintStep>Step 3: Add Royalties</MintStep>
            <MintInstruction>{"NFT Royalty (%):"}</MintInstruction>
            <ConfigProvider>
                <InputNumber
                    value = {royalty}
                    onChange={
                        (val: number) => setRoyalty(val)
                    }
                />
            </ConfigProvider>
            <ButtonContainer>
                <Button
                    type="primary"
                    size="large"
                    className="action-btn mt-5"
                    style={{backgroundColor:"#4096ff", margin:"10px"}}
                    onClick={() => {props.back();}}
                >
                    Back
                </Button>
                <Button
                    type="primary"
                    size="large"
                    className="action-btn mt-5"
                    style={{backgroundColor:"#4096ff", margin:"10px"}}
                    onClick={submitData}
                >
                    Next
                </Button>
            </ButtonContainer>
        </div>
    </>
    )
}

const ConfirmSection = (props:{
    confirm: () => void;
    back: () => void;
    mintNFT: () => void;
    publicMetadata;
    privateMetadata;
    jsonMetadata;
    imageUrl;
    uploading;
}) =>{
    console.log("JSON Metadata:", props.jsonMetadata)
    const CardAttribute = styled.div`
        margin: 5px 0;
        padding: 10px;
        background: #2a2a2a;
        border-radius: 5px;
        color: #ddd;
        text-align:left;
    `
    const AttributeTitle = styled.div`
        font-weight: bold;
    `
    const CardInformation = styled.div`
        padding: 15px;
        width: 400px;
    `

    const confirmMinting = async () =>{
        await props.mintNFT();
        props.confirm();
    }

    return(
        <>
        <div className='justify-content-center align-items-center white'>
            <MintStep>Step 4: Confirm Your NFT Mint</MintStep>
            <div className="flex mb-5">
                <div className="p-5">
                    {props.imageUrl? <img width={300} height={300} src={props.imageUrl}/> : <h1>No Image Detected</h1>}
                </div>
                <div className="ml-5 w-100">
                    <CardInformation>
                    <CardAttribute>
                        <AttributeTitle>Name:</AttributeTitle>
                        <span>{props.jsonMetadata.name}</span>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Symbol:</AttributeTitle>
                        <span>{props.jsonMetadata.symbol}</span>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Description:</AttributeTitle>
                        <span>{props.jsonMetadata.description}</span>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Category:</AttributeTitle>
                        <span>{props.jsonMetadata.category}</span>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Royalty Fee:</AttributeTitle>
                        <span>{props.jsonMetadata.sellerFeeBasisPoints/100}%</span>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Private Data:</AttributeTitle>
                        <span>{props.privateMetadata.name}</span>
                    </CardAttribute>
                    </CardInformation>

                </div>
            </div>
            <ButtonContainer>
                <Button
                    type="primary"
                    size="large"
                    className="action-btn mt-5"
                    style={{backgroundColor:"#4096ff", margin:"10px"}}
                    onClick={() => {props.back();}}
                >
                    Back
                </Button>
                {
                    props.uploading?
                    <Button
                        type="primary"
                        size="large"
                        className="action-btn mt-5"
                        style={{backgroundColor:"#aaaaaa", margin:"10px"}}
                    >
                        Uploading File...
                    </Button>
                    :
                    <Button
                        type="primary"
                        size="large"
                        className="action-btn mt-5"
                        style={{backgroundColor:"#4096ff", margin:"10px"}}
                        onClick={confirmMinting}
                    >
                        Mint NFT
                    </Button>
                }
            </ButtonContainer>
        </div>
    </>
    )
}

const CompletedSection = ({cid}) =>{
    const CompletionTitle = styled.div`
        font-family: Arial, sans-serif;
        font-size: 30px;
        font-weight: bold;
        display:flex !important;
        justify-content:center;
        align-items:center;
        text-align:center;
    `
    const route = useRouter();
    return(<>
        <div className='flex justify-content-center align-items-center white !important'>
            <ButtonContainer>
            <CompletionTitle>NFT Minting Completed!</CompletionTitle>
                <div className="flex justify-content-center align-items-center w-100 mt-5" style={{ textAlign: 'center' }}>
                    <div style={{ margin: '0 auto' }}>
                        <img alignContent="center" src={"https://ivory-vivacious-rooster-272.mypinata.cloud/ipfs/QmWvJwxPEHmFygSWWdWNeKqkYiZ5kufvjmd5jSkbBEPP62"} width="150" height="150" />
                    </div>
                </div>
            </ButtonContainer>
        </div>
        <ButtonContainer>
            <Button
                type="primary"
                size="large"
                className="action-btn mt-5"
                style={{backgroundColor:"#4096ff", marginTop:"40px", paddingBottom:"35px", marginLeft:"10px", marginRight:"10px"}}
                onClick={() => {route.push(`/`)}}
            >
                Home
            </Button>
            <Button
                type="primary"
                size="large"
                className="action-btn mt-5"
                style={{backgroundColor:"#4096ff", marginTop:"40px", paddingBottom:"35px", marginLeft:"10px", marginRight:"10px"}}
                onClick={() => {route.push(`/nft/${cid}`)}}
            >
                Open NFT
            </Button>
        </ButtonContainer>
    </>)
}