import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  try {
    const accounts = await hre.ethers.getSigners();
    console.log("📋 Available accounts:");
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const address = await account.getAddress();
      const balance = await hre.ethers.provider.getBalance(address);
      
      console.log(`Account ${i}: ${address}`);
      console.log(`Balance: ${hre.ethers.formatEther(balance)} C2FLR`);
      console.log("---");
    }
  } catch (error) {
    console.error("Error getting accounts:", error);
  }
});

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
    coston: {
      url: "https://coston-api.flare.network/ext/C/rpc",
      chainId: 16,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 20000,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    coston2: {
      url: "https://coston2-api.flare.network/ext/C/rpc",
      chainId: 114,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 20000,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    flare: {
      url: "https://flare-api.flare.network/ext/C/rpc",
      chainId: 14,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 20000,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  mocha: {
    timeout: 40000
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;