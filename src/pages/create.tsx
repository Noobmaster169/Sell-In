import type { NextPage } from "next";
import Head from "next/head";
import { CreateView } from "../views";

const Create: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Sell In</title>
        <meta
          name="description"
          content="Basic Functionality"
        />
      </Head>
      <CreateView />
    </div>
  );
};

export default Create;
