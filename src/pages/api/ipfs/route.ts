import { NextResponse, NextRequest } from "next/server";
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';


export const config = {
    api: {
      bodyParser: false,
    },
  };

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const form = formidable();
    form.parse(req, async (err, fields, files) => {
        console.log("Parse Section executed")
        if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
        }
        try {
            const file: File = files.file;
            // Use file and additionalData as needed
            console.log("File:", file);
            // Your remaining logic...
            return res.status(200).json({ success: true , response:"Sucessful"});
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });
    return res.status(200).json({success: true , response:"ENDED?"})
    /*try {
        const data = new FormData();
        const file = await req.body.file;
        return res.status(200).json({response: file})
        //return res.status(200).json({IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png", response: req.body})
        //const file: File | null = data.get("file") as unknown as File;
        data.append("file", file);
        data.append("pinataMetadata", JSON.stringify({ name: "File to upload" }));
        const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
        if (!pinataJwt) {
            throw new Error('PINATA_JWT is not defined');
        }
        //return res.status(200).json({ IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png" })
        const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pinataJwt}`,
            },
            body: data,
        });
        return res.status(200).json({IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png", response: req.body})
        const { IpfsHash } = await pinataResponse.json();
        console.log(IpfsHash);
        return res.status(200).json({ IpfsHash });
    } catch (e) {
        //return res.status(200).json({ IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png" })
        console.error(e);
        return res.status(500).json({ error: e });
    }*/
};
  
/*export default function handler( req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({ IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png" })
    //return NextResponse.json({ IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png" }, { status: 200 });
}*/
  
/*
export async function POST(req: NextApiRequest, res: NextApiResponse) {
    return res.status(200).json({ IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png" })
    //return
    return NextResponse.json({ IpfsHash:"QmV9Q8v6thK9pVHav3NvLau75etQrprYKmn7V9jhk6yDV4/collection.png" }, { status: 200 });
    try {
        console.log("Uploading File to IPFS")
        const data = await req.formData();
        const file: File | null = data.get("file") as unknown as File;
        data.append("file", file);
        data.append("pinataMetadata", JSON.stringify({ name: "File to upload" }));
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        body: data,
        });
        const { IpfsHash } = await res.json();
        console.log(IpfsHash);
        //return res.status(200).json({ IpfsHash })
        return NextResponse.json({ IpfsHash }, { status: 200 });
    } catch (e) {
        console.log(e);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
        //return res.status(500).json({ error: e });
    }
}
*/