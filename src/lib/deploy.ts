import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Deployment = {
  creditcoin: {
    chainId: number;
    rpc: string;
    explorer: string;
    vault?: string;
    prover: string;
    decoder: string;
  };
  sepolia: {
    chainId: number;
    rpc: string;
    explorer: string;
    invoicePay?: string;
    quayUsd?: string;
  };
};

const DEFAULTS: Deployment = {
  creditcoin: {
    chainId: 102031,
    rpc: "https://rpc.cc3-testnet.creditcoin.network",
    explorer: "https://creditcoin-testnet.blockscout.com",
    prover: "0x0000000000000000000000000000000000000FD2",
    decoder: "0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f",
  },
  sepolia: {
    chainId: 11155111,
    rpc: "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
  },
};

export function loadDeployment(): Deployment {
  const path = join(process.cwd(), "contracts/out/deployment.json");
  const file: Partial<Deployment> = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf8"))
    : {};
  return {
    creditcoin: {
      ...DEFAULTS.creditcoin,
      ...file.creditcoin,
      vault: process.env.DUE_VAULT_ADDRESS || file.creditcoin?.vault,
    },
    sepolia: {
      ...DEFAULTS.sepolia,
      ...file.sepolia,
      invoicePay: process.env.INVOICE_PAY_ADDRESS || file.sepolia?.invoicePay,
      quayUsd: process.env.QUAY_USD_ADDRESS || file.sepolia?.quayUsd,
    },
  };
}

export function liveConfigured(): boolean {
  return Boolean(process.env.CREDITCOIN_PRIVATE_KEY && process.env.SEPOLIA_PRIVATE_KEY);
}
