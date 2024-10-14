import { ethers } from "ethers";
import express from "express";
import config from "./config.json" assert { type: "json" };
import abi from "./abi.json" assert { type: "json" };
import { fromBech32, isValidBech32 } from "./utils.js";
import "dotenv/config";

// Configure your provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(
  process.env.OWNER_PRIVATE_KEY, provider
);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// Express server
const app = express();

app.use(express.json());

app.post("/", async (req, res) => {
  const { address } = req.body;

  let recipient = address;

  if (!ethers.isAddress(address)) {
    if (isValidBech32(address)) {
      recipient = fromBech32(address);
    } else {
      return res.status(400).send("Invalid address");
    }
  }

  console.log("recipient:", recipient);

  try {
    // Call the withdraw function
    const tx = await contract.withdraw(recipient);
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined
    await tx.wait();
    res.status(200).send({ txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: error?.info?.error?.message ?? error?.message ?? error });
  }
});

app.listen(config.port, () => {
  console.log(`Faucet server running on http://localhost:${config.port}`);
});
