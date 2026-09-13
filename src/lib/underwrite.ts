import { underwrite, type AttestedFact, type Decision, type Invoice } from "./policy";

export type Claim = {
  label: string;
  txHash: string;
  attested: boolean;
};

export type Opinion = Decision & {
  officer: "Reed";
  saw: string[];
  ignored: string[];
  narrative: string;
};

function qusd(amount: bigint): string {
  const n = Number(amount) / 1_000_000;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Reed only underwrites from Attestcoin facts. Claims are shown, never scored. */
export function reed(invoice: Invoice, facts: AttestedFact[], claims: Claim[]): Opinion {
  const ignored = claims.filter((c) => !c.attested).map((c) => c.label);
  const saw = facts.map(
    (f) => `InvoicePaid #${f.invoiceId} · ${qusd(f.amount)} qUSD · ${f.txHash.slice(0, 10)}…`,
  );
  if (invoice.advanced) {
    return {
      action: "ADVANCE",
      reason: "already advanced",
      advanceBps: 9000,
      paid: invoice.advancedAmount,
      officer: "Reed",
      saw,
      ignored,
      narrative: `Already advanced ${qusd(invoice.advancedAmount)} qUSD. The vault will not pay this citation twice.`,
    };
  }
  const decision = underwrite(invoice, facts);
  let narrative: string;
  if (decision.action === "HOLD") {
    narrative =
      "Lin Wei filed invoice 4417. Kestrel says it paid on Ethereum. I have no Attestcoin citation, so I will not recommend an advance.";
  } else if (decision.action === "REFUSE") {
    narrative = `Citation arrived and failed policy: ${decision.reason}.`;
  } else {
    narrative = `Citation matches the registered pay desk, token, and face. Advance ${qusd(decision.paid)} qUSD (90%). Hold back 10%.`;
  }
  return { ...decision, officer: "Reed", saw, ignored, narrative };
}
