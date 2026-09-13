import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

const creditcoin = defineChain({
  id: 102031,
  name: "Creditcoin CC3 Testnet",
  nativeCurrency: { name: "CTC", symbol: "CTC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network"] } },
});

const sepolia = defineChain({
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"] } },
});

const DECODER = "0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f";
const PROVER = "0x0000000000000000000000000000000000000FD2";

function load(name) {
  return JSON.parse(readFileSync(join("contracts/out", `${name}.json`), "utf8"));
}

function accountFrom(env) {
  const key = process.env[env];
  if (!key) throw new Error(`${env} is required`);
  return privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);
}

async function deploy() {
  const ctcKey = process.env.CREDITCOIN_PRIVATE_KEY;
  const sepKey = process.env.SEPOLIA_PRIVATE_KEY;
  if (!ctcKey || !sepKey) {
    console.log("Missing keys. Replay still works: npm run dev → /desk?play=1");
    console.log("To deploy: set CREDITCOIN_PRIVATE_KEY and SEPOLIA_PRIVATE_KEY, fund them, rerun.");
    process.exit(0);
  }

  const sepAccount = accountFrom("SEPOLIA_PRIVATE_KEY");
  const ctcAccount = accountFrom("CREDITCOIN_PRIVATE_KEY");
  const sep = createWalletClient({ account: sepAccount, chain: sepolia, transport: http() }).extend(publicActions);
  const ctc = createWalletClient({ account: ctcAccount, chain: creditcoin, transport: http() }).extend(publicActions);

  const quayArt = load("QuayUSD");
  const payArt = load("InvoicePay");
  const vaultArt = load("DueVault");

  const quayHash = await sep.deployContract({ abi: quayArt.abi, bytecode: quayArt.bytecode });
  const quayRc = await sep.waitForTransactionReceipt({ hash: quayHash });
  const quay = quayRc.contractAddress;
  console.log("QuayUSD", quay);

  const payHash = await sep.deployContract({
    abi: payArt.abi,
    bytecode: payArt.bytecode,
    args: [quay],
  });
  const payRc = await sep.waitForTransactionReceipt({ hash: payHash });
  const invoicePay = payRc.contractAddress;
  console.log("InvoicePay", invoicePay);

  const vaultHash = await ctc.deployContract({
    abi: vaultArt.abi,
    bytecode: vaultArt.bytecode,
    args: [PROVER, DECODER, invoicePay],
  });
  const vaultRc = await ctc.waitForTransactionReceipt({ hash: vaultHash });
  const vault = vaultRc.contractAddress;
  console.log("DueVault", vault);

  const deployment = {
    creditcoin: {
      chainId: 102031,
      rpc: creditcoin.rpcUrls.default.http[0],
      explorer: "https://creditcoin-testnet.blockscout.com",
      vault,
      prover: PROVER,
      decoder: DECODER,
    },
    sepolia: {
      chainId: 11155111,
      rpc: sepolia.rpcUrls.default.http[0],
      explorer: "https://sepolia.etherscan.io",
      invoicePay,
      quayUsd: quay,
    },
  };
  writeFileSync(join("contracts/out/deployment.json"), JSON.stringify(deployment, null, 2));
  console.log("wrote contracts/out/deployment.json");
}

if (!existsSync("contracts/out/DueVault.json")) {
  console.error("run npm run chain:compile first");
  process.exit(1);
}

deploy().catch((err) => {
  console.error(err);
  process.exit(1);
});
