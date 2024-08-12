import { decode, encode, toWords, fromWords } from "bech32";
import { Buffer } from "buffer";
import { ethers } from "ethers";

const exocoreBech32Prefix = "exo";

// Function to validate a Bech32 address
export const isValidBech32 = (address) => {
  try {
    const { prefix, words } = decode(address);
    if (!prefix || !words.length) {
      return false;
    }
    return prefix === exocoreBech32Prefix;
  } catch (error) {
    // If there's any error in decoding, return false
    return false;
  }
};

// Function to convert a hexadecimal string to a Bech32 encoded address
export const toBech32 = (hexAddress) => {
  const strippedAddress = hexAddress.startsWith("0x")
    ? hexAddress.slice(2)
    : hexAddress;
  const buffer = Buffer.from(strippedAddress, "hex");
  const words = toWords(buffer);
  return encode(exocoreBech32Prefix, words);
};

// Function to convert a Bech32 encoded address to a hexadecimal string
export const fromBech32 = (bech32Address) => {
  if (!isValidBech32(bech32Address)) {
    throw new Error("Invalid Bech32 address");
  }
  const { words } = decode(bech32Address);
  const buffer = Buffer.from(fromWords(words));
  return ethers.getAddress(`0x${buffer.toString("hex")}`);
};
