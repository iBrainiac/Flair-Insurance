import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Flare Testnet (Coston)
    coston: {
      url: "https://coston-api.flare.network/ext/C/rpc",
      chainId: 16,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Flare Testnet (Coston2)
    coston2: {
      url: "https://coston2-api.flare.network/ext/C/rpc",
      chainId: 114,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Flare Mainnet
    flare: {
      url: "https://flare-api.flare.network/ext/C/rpc",
      chainId: 14,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Local hardhat network (default)
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      coston: "flare", // placeholder
      coston2: "flare", // placeholder
      flare: "flare", // placeholder
    },
    customChains: [
      {
        network: "coston",
        chainId: 16,
        urls: {
          apiURL: "https://coston.testnet.flarescan.com/api",
          browserURL: "https://coston.testnet.flarescan.com/",
        },
      },
      {
        network: "coston2",
        chainId: 114,
        urls: {
          apiURL: "https://coston2.testnet.flarescan.com/api",
          browserURL: "https://coston2.testnet.flarescan.com/",
        },
      },
      {
        network: "flare",
        chainId: 14,
        urls: {
          apiURL: "https://flarescan.com/api",
          browserURL: "https://flarescan.com/",
        },
      },
    ],
  },
};

export default config;
