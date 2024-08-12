import {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
} from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import express from "express";
import config from "./cosm_config.json" assert { type: "json" };
import "dotenv/config";
import { stringToPath } from "@cosmjs/crypto";

// Setup Cosmos client
let client;
let rootAddress;

async function setupClient() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.FAUCET_MNEMONIC || "",
    {
      hdPaths: [stringToPath(config.hdPath)],
      prefix: config.prefix,
    }
  );
  const [account] = await wallet.getAccounts();
  rootAddress = account.address;
  console.log("root address:", rootAddress);

  client = await SigningStargateClient.connectWithSigner(config.lcdUrl, wallet);
  const chainId = await client.getChainId();
  console.log("chain id:", chainId);
}

setupClient();

// Handle faucet request
async function handleRequest(address) {
  if (!client) {
    await setupClient();
  }

  try {
    // Fetch the current balance
    const account = await client.getAccount(rootAddress);
    account.balances.forEach((balance) => {
      console.log(`${rootAddress}: ${balance.amount} ${balance.denom}`);
    });
  } catch (e) {
    console.log("---------------------");
    console.log("balance error:", e);
    console.log("---------------------");
  }

  try {
    // Define transaction parameters
    const amount = [{ denom: config.denom, amount: config.AmountSend }];
    const fee = {
      amount: [{ denom: config.denom, amount: config.feeAmount }], // Fee amount
      gas: "200000", // Gas limit
    };
    const memo = "Faucet request";

    // Perform the transaction
    const result = await client.sendTokens(
      rootAddress,
      address,
      amount,
      fee,
      memo
    );

    // Ensure the transaction was successful
    assertIsDeliverTxSuccess(result);

    return { success: true, txHash: result.transactionHash };
  } catch (error) {
    console.log("---------------------");
    console.log("tx send error:", error);
    console.log("---------------------");
    return { success: false, error: error.message };
  }
}

// Express server
const app = express();

app.use(express.json());

app.post("/request", async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).send({ error: "Address is required" });
  }

  console.log("recipient address:", address);

  const result = await handleRequest(address);

  if (result.success) {
    res.status(200).send({ success: true, txHash: result.txHash });
  } else {
    res.status(500).send({ success: false, error: result.error });
  }
});

app.listen(config.port, () => {
  console.log(`Faucet server running on http://localhost:${config.port}`);
});
