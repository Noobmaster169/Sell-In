import { FC } from "react";
import {NFTCard} from '../../components/NFTCard';
import { notify } from "../../utils/notifications";
import { useRouter } from 'next/router';

export const NFTView: FC = ({id}) => {
  return (
    <div className="md:hero mx-auto p-4 w-100">
        <div className="text-center w-100">
            <div>
            {id && <NFTCard id={id}/>}
            </div>
        </div>
    </div>
  );
};
