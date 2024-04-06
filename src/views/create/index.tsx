import { FC } from "react";
import { SignMessage } from '../../components/SignMessage';
import { SendTransaction } from '../../components/SendTransaction';
import { SendVersionedTransaction } from '../../components/SendVersionedTransaction';
import { Create } from '../../components/Create';
import {UploadNFT} from '../../components/Upload';
import {UploadEncrypted} from '../../components/UploadEncrypted';
import {Mint} from '../../components/Mint';

export const CreateView: FC = ({ }) => {

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
          Create NFT
        </h1>
        {/* CONTENT GOES HERE 
        <div className="text-center">*/}
        <div>
          <Mint/>
        </div>
      </div>
    </div>
  );
};
