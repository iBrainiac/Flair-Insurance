import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log(`🚀 Connecting to ${hre.network.name || 'unknown network'}...`);
  
  try {
    // Get network config
    const networkConfig = hre.network.config;
    if (!networkConfig || !('url' in networkConfig)) {
      throw new Error("Network config not found");
    }
    
    console.log("📡 Network URL:", networkConfig.url);
    console.log("⛓️  Chain ID:", networkConfig.chainId);
    
    // Create provider directly
    const provider = new ethers.JsonRpcProvider(networkConfig.url);
    
    // Verify connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to Chain ID: ${network.chainId}`);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current block: ${blockNumber}`);
    
    // Setup wallet
    let wallet;
    if (networkConfig.accounts && networkConfig.accounts.length > 0) {
      const privateKey = networkConfig.accounts[0] as string;
      wallet = new ethers.Wallet(privateKey, provider);
      console.log(`💰 Wallet address: ${wallet.address}`);
      
      const balance = await provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balance);
      console.log(`💵 Balance: ${balanceEth} ${getTokenSymbol(network.chainId)}`);
      
      // Get gas price
      const feeData = await provider.getFeeData();
      console.log(`⛽ Gas price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : 'N/A'} gwei`);
      
      // Test transaction simulation (dry run)
      console.log("\n🧪 Testing transaction capabilities...");
      
      const gasLimit = 21000n; // Basic transfer gas limit
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const txCost = gasLimit * gasPrice;
      
      console.log(`💸 Transaction cost estimate: ${ethers.formatEther(txCost)} ${getTokenSymbol(network.chainId)}`);
      
      if (balance > txCost) {
        console.log("✅ Sufficient balance for transactions");
      } else {
        console.log("⚠️  Low balance - may not be able to send transactions");
      }
      
    } else {
      console.log("⚠️  No private key configured");
    }
    
    console.log("\n🎉 Setup complete! Ready for deployment.");
    
    return {
      provider,
      wallet,
      network,
      blockNumber
    };
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
}

function getTokenSymbol(chainId: bigint): string {
  switch (chainId.toString()) {
    case '14': return 'FLR';      // Flare Mainnet
    case '16': return 'CFLR';     // Coston Testnet
    case '114': return 'C2FLR';   // Coston2 Testnet
    default: return 'ETH';
  }
}

// Export for use in other scripts
export { main as setupFlareConnection };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
  });
}