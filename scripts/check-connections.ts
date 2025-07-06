import hre from "hardhat";
import { ethers } from "ethers";
import "dotenv/config";


function resolveHardhatUrl(urlConfig: any): string {
  if (typeof urlConfig === "object") {
    if ("value" in urlConfig) return urlConfig.value;
    if ("_value" in urlConfig) return urlConfig._value;

    if (urlConfig.format && urlConfig._type === "ResolvedConfigurationVariable") {
      for (const key of Object.keys(urlConfig)) {
        if (typeof urlConfig[key] === "string" && urlConfig[key].startsWith("http")) {
          return urlConfig[key];
        }
      }
    }
  }

  if (typeof urlConfig === "string") {
    return urlConfig;
  }

  console.log("Debug - URL config object:", JSON.stringify(urlConfig, null, 2));
  throw new Error(`Cannot resolve URL from config: ${typeof urlConfig}`);
}

const fallbackUrls: { [key: string]: string } = {
  coston2: "https://coston2-api.flare.network/ext/C/rpc",
  coston: "https://coston-api.flare.network/ext/C/rpc",
  flare: "https://flare-api.flare.network/ext/C/rpc"
};

async function main() {
  console.log("🔥 Testing Flare Connection (Hardhat 3)...");

  try {
    const networkArgIndex = process.argv.indexOf("--network");
    const networkName = networkArgIndex !== -1
      ? process.argv[networkArgIndex + 1]
      : hre.config.defaultNetwork;

    console.log("🌐 Network:", networkName);

    const networks = hre.config.networks;
    const currentNetwork = networks[networkName];

    if (!currentNetwork || !('url' in currentNetwork)) {
      throw new Error(`Network ${networkName} not found in config`);
    }

    let networkUrl: string;
    try {
      networkUrl = resolveHardhatUrl(currentNetwork.url);
    } catch (urlError) {
      console.warn("⚠️  URL resolution failed, using fallback...");
      if (fallbackUrls[networkName]) {
        networkUrl = fallbackUrls[networkName];
        console.log("✅ Using fallback URL:", networkUrl);
      } else {
        throw urlError;
      }
    }

    console.log("✅ Network URL:", networkUrl);
    console.log("✅ Chain ID:", currentNetwork.chainId);

    const provider = new ethers.JsonRpcProvider(networkUrl);

    console.log("\n🔄 Testing connection...");
    const network = await provider.getNetwork();
    console.log("✅ Connected to chain ID:", network.chainId.toString());

    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Current block number:", blockNumber);

    if (currentNetwork.accounts && currentNetwork.accounts.length > 0) {
      // const privateKey = currentNetwork.accounts[0] as string;
      const privateKey = process.env.PRIVATE_KEY as string;

      const wallet = new ethers.Wallet(privateKey, provider);

      console.log("\n👤 Account Info:");
      console.log("Address:", wallet.address);

      const balance = await provider.getBalance(wallet.address);
      console.log("Balance:", ethers.formatEther(balance), "C2FLR");

      const feeData = await provider.getFeeData();
      console.log("Gas Price:", feeData.gasPrice?.toString() || "N/A");

      try {
        const gasEstimate = await provider.estimateGas({
          to: wallet.address,
          value: ethers.parseEther("0.001")
        });
        console.log("✅ Gas estimation works:", gasEstimate.toString());
      } catch (gasError) {
        console.log("⚠️  Gas estimation failed (this is ok):", gasError.message);
      }

      console.log("\n🎉 Connection test successful! Ready to deploy contracts.");

    } else {
      console.log("⚠️  No private key found in .env file");
      console.log("Create .env file with: PRIVATE_KEY=your_private_key_here");
    }

  } catch (error) {
    console.error("❌ Connection failed:", error);

    console.log("\n🔄 Trying direct connection to Coston2...");
    try {
      const provider = new ethers.JsonRpcProvider(fallbackUrls["coston2"]);
      const blockNumber = await provider.getBlockNumber();
      console.log("✅ Direct connection works! Block:", blockNumber);
    } catch (directError) {
      console.error("❌ Direct connection failed:", directError);
    }
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});
