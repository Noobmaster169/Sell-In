"use client";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useRef } from "react";
import { NextResponse, NextRequest } from "next/server";
import { Connection, clusterApiUrl, Keypair, PublicKey } from "@solana/web3.js";
import axios from 'axios';
import AES from 'crypto-js/aes';
import { enc } from 'crypto-js/core';
import { encryptFile, uploadEncryptedFile, test } from '../utils/ipfs';
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

export const UploadEncrypted = ()=>{
  const wallet = useWallet();
  //const [file, setFile] = useState("");
  const [file, setFile] = useState<any>(null);
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputFile = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);

  const uploadFile = async (fileToUpload) => {
    try {
      setUploading(true);
      //Encrypting The File
    //   const encryptedFile = await encryptData(fileToUpload);
    //   console.log("Encrypted:", encryptedFile);
    //   console.log("File Type:", typeof(encryptedFile))
      //Converting it to Blob
      const testMessage = await test()
      console.log("Test Result:", testMessage)
      await encryptData(fileToUpload);

      const testResult = await uploadEncryptedFile(encryptedData);
      console.log(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${testResult}`);
      
      /*
      //const encryptedFile :BlobPart = await encryptFile(fileToUpload, setEncryptedData);
      //console.log("Encrypted File:", encryptedData);
      const encryptedBlob = new Blob([encryptedData], { type: "application/octet-stream" });
      //const encryptedBlob = new Blob([JSON.stringify({message:"hello"})], { type: "application/json" });
      console.log("File Successfully Encrypted");
      console.log("Encrypted File Type:", encryptedBlob);
      
      const data = new FormData();
      data.set("file", encryptedBlob);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data
      });
      const resData = await res.json();
      setCid(resData.IpfsHash);
      setUploading(false);
      return `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${resData.IpfsHash}`
      
      */
      setCid(testResult);
      setUploading(false);
      return `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${testResult}`
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };
  
  const decryptData = async () => {
    var decryptedData = AES.decrypt(encryptedData, 'your-secret-key').toString(enc.Utf8); //Decryption will fail if key not matched
    console.log(decryptedData)
    setDecryptedData(
      <img src={decryptedData} alt="Decrypted Image"/>
    );
  };

  const decryptImage = async (cipher) => {
    var decryptedImage = AES.decrypt(cipher, 'your-secret-key').toString(enc.Utf8); //Decryption will fail if key not matched
    console.log(decryptedImage)
    setDecryptedData(
      <img src={decryptedImage} alt="Decrypted IPFS Image"/>
    );
  };

    async function decryptBlob(encryptedBlob) {
        // Read the encrypted blob as an ArrayBuffer
        const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();

        // Convert the ArrayBuffer to a string
        const encryptedData = new Uint8Array(encryptedArrayBuffer);
        const encryptedString = String.fromCharCode.apply(null, encryptedData);

        // Use a library like CryptoJS for AES decryption
        // Example using CryptoJS:
        const decrypted = AES.decrypt(encryptedString, 'your-secret-key');

        // Convert the decrypted data to a Uint8Array
        const decryptedData = enc.Utf8.parse(decrypted.toString(enc.Utf8));
        const decryptedArray = new Uint8Array(decryptedData);

        // Convert Uint8Array to Blob
        const decryptedBlob = new Blob([decryptedArray], { type: "application/octet-stream" });

        return decryptedBlob;
    }

  const encryptData= async (rawFile) =>{
    try{
      var reader = new FileReader();
      reader.readAsDataURL(rawFile);
      reader.onload = function () {
          var encryptedData = AES.encrypt(reader.result, 'your-secret-key').toString(); 
          setEncryptedData(encryptedData)
          console.log("Encrypted data:", encryptedData);
          return encryptedData;
      };
    }catch(error){
      console.log(error);
    }
  }

  const handleChange = async (fileToUpload) => {
    setFile(fileToUpload);
    setImageUrl(URL.createObjectURL(fileToUpload));
    console.log("Uploading Image")
    const ipfsUrl = await uploadFile(fileToUpload);
    console.log("Image Uploaded to IPFS:", ipfsUrl);
  };

  const fetchFromIpfs = async () =>{
    if(!cid){
        alert("CID is empty")
        return
    }
    console.log("Fetching data from ipfs")
    console.log("Fetched Link:", `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${cid}`)
    const res = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${cid}`)
    const html = await res.text();
    console.log("HTML:", html); // Log the HTML content
    console.log("Type:", typeof(html));
    console.log("Decrypting Blob")
    decryptImage(html);
    console.log("Successful?????????")
  }

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
    
      {decryptedData ? decryptedData: <p>No Decrypted Image Detected</p>}

      <button onClick = {fetchFromIpfs}>Fetch Data</button>
    </main>
  );
}
