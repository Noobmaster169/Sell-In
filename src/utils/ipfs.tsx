import AES from 'crypto-js/aes';

export async function encryptFile(fileToEncrypt, setFile) {
    var reader = new FileReader();
    reader.readAsDataURL(fileToEncrypt);
    reader.onload = function () {
        var encryptedData = AES.encrypt(reader.result, 'your-sceret-key').toString(); 
        
        setFile(encryptedData);
        return encryptedData;
    };
}

export async function uploadEncryptedFile(fileToUpload){
    console.log("Uploading Encrypted File")
    const encryptedBlob = new Blob([fileToUpload], { type: "application/octet-stream" });    
    const data = new FormData();
    data.set("file", encryptedBlob);
    const res = await fetch("/api/upload", {
        method: "POST",
        body: data
    });
    const resData = await res.json();
    return resData.IpfsHash;
    
    /*setCid(resData.IpfsHash);
    setUploading(false);
    return `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${resData.IpfsHash}`*/
}

export async function uploadPublicFile(fileToUpload){
    console.log("Uploading Public File")
    const data = new FormData();
    data.set("file", fileToUpload);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: data
    });
    const resData = await res.json();
    return resData.IpfsHash;
}

export async function uploadJSON(fileToUpload){
    console.log("Uploading JSON File")
    const blob = new Blob([JSON.stringify(fileToUpload)], { type: "application/json" });
    const data = new FormData();
    data.append("file", blob);
    const res = await fetch("/api/upload", {
    method: "POST",
    body: data,
    });
    const resData = await res.json();
    return resData.IpfsHash;
}