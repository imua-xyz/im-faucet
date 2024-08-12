import { ethers } from "ethers";
import express from "express";
import config from "./config.json" assert { type: "json" };
import abi from "./abi.json" assert { type: "json" };
import "dotenv/config";

// Configure your provider and wallet
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = ethers.Wallet.fromPhrase(
  process.env.FAUCET_MNEMONIC ?? "",
  provider
);
const contract = new ethers.Contract(config.contract, abi, wallet);

// Express server
const app = express();

app.use(express.json());

app.post("/request", async (req, res) => {
  const { address } = req.body;

  if (!ethers.isAddress(address)) {
    return res.status(400).send("Invalid address");
  }

  try {
    // Call the withdraw function
    const tx = await contract.withdraw(address);
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined
    await tx.wait();
    res.status(200).send({ txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).send("Transaction failed");
  }
});

app.listen(config.port, () => {
  console.log(`Faucet server running on http://localhost:${config.port}`);
});
