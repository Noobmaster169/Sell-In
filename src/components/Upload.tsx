"use client";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useRef } from "react";
import { NextResponse, NextRequest } from "next/server";
import { Connection, clusterApiUrl, Keypair, PublicKey } from "@solana/web3.js";
import axios from 'axios';
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

const {Dragger} = Upload;

export const UploadNFT = ()=>{
  const wallet = useWallet();
  //const [file, setFile] = useState("");
  const [file, setFile] = useState<any>(null);
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputFile = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);

  const uploadFile = async (fileToUpload) => {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data
      });
      const resData = await res.json();
      setCid(resData.IpfsHash);
      setUploading(false);
      return `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${resData.IpfsHash}`
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const uploadJSON = async (imageUrl) =>{
    const jsonData = {
      "name": "ExampleJSON",
      "age": "18",
      "job": "programmer"
    };
    
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
      image: imageUrl,
      attributes: CONFIG.attributes,
      properties:{
        files:[
          {
            type: CONFIG.imgType,
            uri: imageUrl,
          },
        ]
      }
    };

    console.log("Uploading JSON");
    try{
      const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const data = new FormData();
      data.append("file", blob);
      const res = await fetch("/api/upload", {
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

  const handleUpload = async ()=>{
    setImageUrl(URL.createObjectURL(file));
    console.log("Uploading Image")
    const ipfsUrl = await uploadFile(file);
    console.log("Image Uploaded to IPFS:", ipfsUrl);
    console.log("Uploading Metadata")
    const metadataUrl = await uploadJSON(ipfsUrl);
  }

  const handleChange = async (fileToUpload) => {
    setFile(fileToUpload);
    // setImageUrl(URL.createObjectURL(fileToUpload));
    // console.log("Uploading Image")
    // const ipfsUrl = await uploadFile(fileToUpload);
    // console.log("Image Uploaded to IPFS:", ipfsUrl);
    // console.log("Uploading Metadata")
    // const metadataUrl = await uploadJSON(ipfsUrl);
  };

  return (
    <main className="w-full min-h-screen m-auto flex flex-col justify-center items-center">
      <Upload.Dragger
        accept=".png,.jpg,.gif,.mp4,.svg"
        style={{ padding: 20, color: "red !important" }}
        fileList={file ? [file as any] : []}
        onChange={
          info =>{
            handleChange(info.file.originFileObj); 
            //setFile(info.file.originFileObj);
            //uploadFile(info.file.originFileObj);
          }
        }
        multiple={false}
      >
        <div className="ant-upload-drag-icon">
          <h3 style={{ fontWeight: 700, color: "red" }}>
            Upload your cover image (PNG, JPG, GIF, SVG)
          </h3>
        </div>
        <p style={{ color: "red" }} className="ant-upload-text">
          Drag and drop, or click to browse
        </p>
      </Upload.Dragger>
      <button onClick={handleUpload}>Upload File</button>

      {/*<input type="file" id="file" ref={inputFile} onChange={handleChange} />
      <button disabled={uploading} onClick={() => inputFile.current.click()}>
        {uploading ? "Uploading..." : "Upload"}
      </button>*/}
      {cid && (
        <>
        <img
          src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${cid}`}
          alt="Image from IPFS"
        />
        {file && (
          <div>
            <h2>Uploaded File:</h2>
            <p>Name: {file.name}</p>
            <p>Type: {file.type}</p>
            <p>Size: {file.size} bytes</p>
            {file.type.startsWith('image/') && (
              <div>
                <h3>Preview:</h3>
                <img src={imageUrl} alt="Uploaded file" style={{ maxWidth: '100%' }} />
              </div>
            )}
          </div>
        )}
        </>
      )}
    </main>
  );
}
