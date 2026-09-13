import { json } from "@/lib/json";
import { liveConfigured, loadDeployment } from "@/lib/deploy";

export const dynamic = "force-dynamic";

export async function GET() {
  const deploy = loadDeployment();
  return json({
    replay: !liveConfigured(),
    live: liveConfigured(),
    vault: deploy.creditcoin.vault || null,
    invoicePay: deploy.sepolia.invoicePay || null,
    prover: deploy.creditcoin.prover,
    decoder: deploy.creditcoin.decoder,
    chainId: deploy.creditcoin.chainId,
  });
}
