import { Wallet } from "ethers";

const pk = "174266cea6923d122cd953c9c64b5d95883b4d14a86fa664de4059c9e61bfc61";

try {
  const wallet = new Wallet(pk);
  console.log("✅ Wallet address:", wallet.address);
} catch (e) {
  console.error("❌ Failed to create wallet:", e);
}
