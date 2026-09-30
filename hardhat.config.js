require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Accept PRIVATE_KEY with or without a leading "0x". When it is unset, leave the
// accounts list empty so signer-free tasks (compile, test) still run.
const rawKey = (process.env.PRIVATE_KEY || "").trim().replace(/^0x/, "");
const accounts = rawKey ? [`0x${rawKey}`] : [];

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.mainnet.arc.io",
      chainId: 5042,
      accounts
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.io",
      chainId: 5042002,
      accounts
    }
  }
};
