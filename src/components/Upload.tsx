"use client";

import { useState, useRef } from "react";
import { NextResponse, NextRequest } from "next/server";
import { Connection, clusterApiUrl, Keypair, PublicKey } from "@solana/web3.js";
import axios from 'axios';

export const Upload = ()=>{
  const [file, setFile] = useState("");
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputFile = useRef(null);

  const uploadFile = async (fileToUpload) => {
    try {
      const data = new FormData();
      data.set("image", fileToUpload);
      console.log("Data:", data);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      
      
      /*const data = new FormData();
      data.append("file", fileToUpload);
      console.log(fileToUpload);
      const res = await fetch("/api/ipfs/route", {
        method: "POST",
        body: data,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      /*const res = await axios.post('/api/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(res.data.message);
      console.log(res.data.file);
      /*setUploading(true);
      const data = new FormData();
      data.append("file", fileToUpload);
      console.log(data);
      console.log(fileToUpload);
      console.log("Get Method:", data.get("file"))
      console.log("JWT:", process.env.NEXT_PUBLIC_PINATA_JWT);
      const res = await fetch("/api/ipfs/route", {
        method: "POST",
        body: data,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log("Response:", res)
      const resData = await res.json();
      console.log("Image Uploaded to IPFS:", resData.IpfsHash);
      console.log("Link:", `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${ resData.IpfsHash}`)
      setCid(resData.IpfsHash);
      setUploading(false);
      console.log(resData.response.get("file"))*/

    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    uploadFile(e.target.files[0]);
  };

  const uploadJSON = async () =>{
    const jsonData = {
      "name": "ExampleJSON",
      "age": "18",
      "job": "programmer"
    };

    //let secretKey: Uint8Array= decode("4vQ9TisZY57w8NhvgKudoVe9WNPBWoLjQoYsKEJgGsrQYtRoBNz6Q6BzZwpy2KqYEAKhk9iZJ1xbhyEL4dz4NQkL");
    const wallet=  Keypair.generate();
    console.log("Key:",wallet.publicKey);
    
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

    const metadata = {
      name: "NFT Name",
      description: "This is NFT Description",
      image: "https://ivory-vivacious-rooster-272.mypinata.cloud/ipfs/QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png",
      attributes: CONFIG.attributes,
      properties:{
        files:[
          {
            type: CONFIG.imgType,
            uri: "https://ivory-vivacious-rooster-272.mypinata.cloud/ipfs/QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png",
          },
        ]
      }
    };

    console.log("Uploading JSON");
    try{
      const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const data = new FormData();
      data.append("file", blob);

      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const resData = await res.json();
      console.log(resData);
      console.log("Text Uploaded to IPFS")
      console.log(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${resData.IpfsHash}`)
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <main className="w-full min-h-screen m-auto flex flex-col justify-center items-center">
      <input type="file" id="file" ref={inputFile} onChange={handleChange} />
      <button disabled={uploading} onClick={() => inputFile.current.click()}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {cid && (
        <img
          src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${cid}`}
          alt="Image from IPFS"
        />
      )}
      <button onClick={uploadJSON}>Upload JSON</button>
    </main>
  );
}
