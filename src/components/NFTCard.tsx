import styled from 'styled-components';
import { Metaplex, walletAdapterIdentity, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, toDateTime, sol, TransactionBuilder} from "@metaplex-foundation/js";
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { notify } from "../utils/notifications";
import React, { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import NFT from 'pages/nft/[id]';
import { useRouter } from 'next/router';
import AES from 'crypto-js/aes';
import { enc } from 'crypto-js/core';


const CardDisplay = styled.div`
    width: 800px;
    background: #1e1e1e;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
    margin: auto;
    overflow: hidden;
`;
const CardTitle = styled.div`
    background-color: #333;
    color: #fff;
    padding: 15px;
    text-align: center;
    font-size:30px;
`
const CardBody = styled.div`
    padding: 0px 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
`
const CardImage = styled.div`
    padding: 15px;
    width: 40%;
    display:flex;
    justify-content:center;
    align-items:center;
`
const CardInformation = styled.div`
    padding: 15px;
    width: 60%;
`
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
const DecryptButton = styled.div`
    background-color: #e6007e;
    color: #fff;
    padding: 8px 20px;
    font-weight: bold;
    font-size: 20px;
    border: none;
    cursor: pointer;
    display: block;
    width: auto;
    text-align: center;
    margin-top: 15px;
    border-radius: 5px;
`

const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');

export const NFTCard = ({id}) =>{
    console.log("Displaying Card with Address:", id)
    const { connection } = useConnection();
    const wallet = useWallet();
    const router = useRouter();
    
    const [image, setImage] = useState('');
    const [title, setTitle] = useState('Loading Title...');
    const [description, setDescription] = useState('Loading...')
    const [category, setCategory] = useState('Loading...')
    const [royalty, setRoyalty] = useState('Loading...')
    const [cipherUrl, setCipherUrl] = useState(null);

    const METAPLEX = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet))
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: quicknodeEndpoint,
            timeout: 60000,
        }));

    async function searchNFT(mintAddress){
        try{
            console.log("Mint Key:", mintAddress)
            
            const nft: any = await METAPLEX.nfts().findByMint({ mintAddress }, { commitment: "finalized" });
            console.log("NFT:", nft.json)
            setImage(nft.json.image ); 
            setTitle(nft.json.name);
            setDescription(nft.json.description);
            setCategory(nft.json.category? nft.json.category : "Not Found")
            try{
                setCipherUrl(nft.json.privateMetadata);
            }catch(e){
                console.log("Private Metadata Not Found In The NFT")
            }
        }catch(error){
            console.log(error);
            notify({ type: 'error', message: `NFT Not Found!`, description: error?.message });
            router.push('/');
        }
    }

    /*!! This Function Hasn't Been Integrated With The Smart Contract !!*/
    async function decryptData(){
        console.log("Trying To Decrypt Data");
        if(!cipherUrl){
            notify({ type: 'error', message: `Private Metadata Not Found!`});
            return;
        }
        try{
            console.log("Fetching data from ipfs")
            console.log("Fetched Link:", cipherUrl)
            const res = await fetch(cipherUrl)
            console.log("Response:", res);
            const html = await res.text();
            console.log("HTML:", html); // Log the HTML content
            console.log("Decrypting Blob")
            
            //!! This is a temporary method to decrypt file. Will Be Integrated With Smart Contract !!
            var decryptedFile = AES.decrypt(html, wallet.publicKey.toString()).toString(enc.Utf8); 
            console.log(decryptedFile)
            
            const base64Data = decryptedFile.split(',')[1];
            const binaryData = atob(base64Data);
            // Create array buffer from binary data
            const arrayBuffer = new ArrayBuffer(binaryData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
            }
            // Get file type
            const typeMatch = decryptedFile.match(/^data:(.+);base64/);
            const fileType = typeMatch ? typeMatch[1] : 'application/octet-stream';

            // Create blob
            const blob = new Blob([arrayBuffer], { type: fileType });
            let filename = title;
            const extensionMatch = fileType.split("/")[1]
            console.log("File Type:", fileType);
            console.log("Extension:", extensionMatch);
            if (extensionMatch) {
            filename += `.${extensionMatch}`;
            } else {
            filename += '.bin';
            }

            // Download The File
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            console.log("Successful?????????")
        }catch(error){
            console.log(error)
            notify({ type: 'error', message: `Data Decryption Process Failed!` });
            return;
        }
    }

    useEffect(() => {
        try{
            const mintAddress = new PublicKey(id);
            console.log("Mint Address:", mintAddress);
            searchNFT(mintAddress)
        }catch(error){
            console.log(error);
            notify({ type: 'error', message: `Invalid Token Address!`, description: error?.message });
            router.push('/');
        }
    }, [])

    return(
        <>
        <CardDisplay>
            <CardTitle>
                {title}
            </CardTitle>
            <CardBody>
                <CardImage>
                <img src={image} alt="NFT Image" width={200} height={200}/>
                </CardImage>
                <CardInformation>
                    <CardAttribute>
                        <AttributeTitle>Address:</AttributeTitle>
                        <a href={`https://explorer.solana.com/address/${id}/metadata?cluster=devnet`} target="_blank">
                        <span>{id}</span>
                        </a>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Description:</AttributeTitle>
                        <span>{description}</span>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Category:</AttributeTitle>
                        <span>{category}</span>
                    </CardAttribute>
                    <CardAttribute>
                        <AttributeTitle>Price:</AttributeTitle>
                        <span>NOT LISTED</span>
                    </CardAttribute>
                    <DecryptButton onClick={() => decryptData()}>
                        Decrypt NFT Data
                    </DecryptButton>
                </CardInformation>
            </CardBody>
        </CardDisplay>
        </>
    )
}