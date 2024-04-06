import styled from 'styled-components';
import { Metaplex, walletAdapterIdentity, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, toDateTime, sol, TransactionBuilder} from "@metaplex-foundation/js";
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { notify } from "../utils/notifications";
import React, { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import NFT from 'pages/nft/[id]';
import { useRouter } from 'next/router';


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
        }catch(error){
            console.log(error);
            notify({ type: 'error', message: `NFT Not Found!`, description: error?.message });
            router.push('/');
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
                        <span>{id}</span>
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
                    <DecryptButton>
                        Decrypt NFT Data
                    </DecryptButton>
                </CardInformation>
            </CardBody>
        </CardDisplay>
        </>
    )
}