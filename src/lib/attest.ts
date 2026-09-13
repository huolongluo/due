import "server-only";
import { liveConfigured, loadDeployment } from "./deploy";

type ProofPacket = {
  chainKey: number;
  headerNumber: number;
  txBytes: string;
  merkleProof: { root: string; siblings: { hash: string; isLeft: boolean }[] };
  continuityProof: { lowerEndpointDigest: string; roots: string[] };
};

export type CiteResult =
  | { ok: true; mode: "replay" | "live"; txHash?: string }
  | { ok: false; error: string };

export async function citeOnCreditcoin(sourceTxHash: string): Promise<CiteResult> {
  if (!liveConfigured()) {
    return { ok: true, mode: "replay" };
  }

  const deploy = loadDeployment();
  if (!deploy.creditcoin.vault) {
    return { ok: false, error: "DueVault not deployed. Run npm run chain:deploy." };
  }

  const [{ JsonRpcProvider, Wallet, Contract }, sdk] = await Promise.all([
    import("ethers"),
    import("@gluwa/usc-sdk"),
  ]);

  const sepolia = new JsonRpcProvider(deploy.sepolia.rpc);
  const creditcoin = new JsonRpcProvider(deploy.creditcoin.rpc);
  const wallet = new Wallet(process.env.CREDITCOIN_PRIVATE_KEY as string, creditcoin);
  const proofBuilder = new sdk.proofProvider.service.ProofBuilder(
    1,
    process.env.PROOF_BUILDER_URL || "https://proof-gen-api.cc3-testnet.creditcoin.network",
  );

  const tx = await sepolia.getTransaction(sourceTxHash);
  if (!tx?.blockNumber) return { ok: false, error: "source tx not found" };

  await proofBuilder.waitUntilHeightAttested(1, tx.blockNumber);
  const result = await proofBuilder.getProof(sourceTxHash);
  if (!result.success || !result.data) {
    return { ok: false, error: result.error || "proof builder failed" };
  }

  const proof = result.data as ProofPacket;
  const abi = [
    "function cite(uint64,uint64,bytes,(bytes32,(bytes32,bool)[]),(bytes32,bytes32[])) returns (uint256,uint256)",
  ];
  const vault = new Contract(deploy.creditcoin.vault, abi, wallet);
  const sent = await vault.cite(
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleProof,
    proof.continuityProof,
  );
  const receipt = await sent.wait();
  return { ok: true, mode: "live", txHash: receipt?.hash };
}
