require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY, UOMI_RPC_URL } = process.env;

/**
 * UOMI Finney testnet:
 *  - RPC: https://finney.uomi.ai
 *  - chainId: 4386
 */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    uomi: {
      url: UOMI_RPC_URL || "https://finney.uomi.ai",
      chainId: 4386,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  mocha: {
    timeout: 60_000,
  },
};
