import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse, NextRequest } from "next/server";
import multer from 'multer';

export const config = { runtime: 'edge'};

  
export default async function POST(request: NextRequest) {
    try {
        console.log("Displaying Shit")

        const formData = await request.formData();
        const file = formData.getAll('files')[0]

        console.log(formData)
        // const file = await request.formData
        // console.log("File:", typeof(file))
        // console.log(file)
        //const data = await request.formData();
        //const file: File | null = data.get("file") as unknown as File;
        console.log("Successful");
        const data:any = null;
        data.append("file", file);
        data.append("pinataMetadata", JSON.stringify({ name: "File to upload" }));
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: data,
        });
        const { IpfsHash } = await res.json();
        console.log(IpfsHash);

        return NextResponse.json({ IpfsHash }, { status: 200 });
    } catch (e) {
        console.log("Error:", e);
        return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
        );
    }
}

const upload = multer({ dest: 'uploads/' });


// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'POST') {
        
//         const data = await req.body.formData()
//         console.log(data);
//         // upload.single('inputFile')(req, res, async function (err: any) {
//         //     if (err) {
//         //         // Error handling
//         //         return res.status(500).json({ error: err.message });
//         //     }
//         //     // Access the uploaded file
//         //     const file = req.file;
//         //     // Log the file details
//         //     console.log(file);
//         //     // Send a response
//         //     res.status(200).json({ message: 'File uploaded successfully' });
//         // });
//         res.status(200).json({ message: 'Hello from Next.js!' })
//         // return;
//     } 
//     else {
//         res.setHeader('Allow', ['POST']);
//         res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
// }