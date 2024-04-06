import { NextPage } from "next";
import Head from "next/head";
import { NFTView } from "../../views";
import { useRouter } from 'next/router';

const NFT: NextPage = () => {
    const router = useRouter();
    const { id } = router.query;
    
    return (
        <div>
            <Head>
                <title>Sell In</title>
                <meta
                    name="description"
                    content="Basic Functionality"
                />
            </Head>
            <NFTView id={id}/>
        </div>
    );
};

export default NFT;