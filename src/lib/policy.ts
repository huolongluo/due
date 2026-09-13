export const FACE = 12_000_000_000n; // 12,000 qUSD, 6 decimals
export const ADVANCE_BPS = 9000;
export const INVOICE_ID = 4417;
export const SOURCE_PAY = "0x1111111111111111111111111111111111114417";
export const TOKEN = "0x2222222222222222222222222222222222224417";
export const SUPPLIER = "0x3333333331111111111111111111111111114417";
export const PAYER = "0x4444444441111111111111111111111111114417";

export type Invoice = {
  id: number;
  supplier: string;
  token: string;
  source: string;
  face: bigint;
  citedAmount: bigint;
  citedPayer: string | null;
  citedTx: string | null;
  advanced: boolean;
  advancedAmount: bigint;
};

export type AttestedFact = {
  invoiceId: number;
  payer: string;
  token: string;
  amount: bigint;
  source: string;
  txHash: string;
  receiptStatus: number;
};

export type Decision = {
  action: "ADVANCE" | "REFUSE" | "HOLD";
  reason: string;
  advanceBps: number;
  paid: bigint;
};

export function advanceAmount(face: bigint, bps = ADVANCE_BPS): bigint {
  return (face * BigInt(bps)) / 10_000n;
}

export function openInvoice(): Invoice {
  return {
    id: INVOICE_ID,
    supplier: SUPPLIER,
    token: TOKEN,
    source: SOURCE_PAY,
    face: FACE,
    citedAmount: 0n,
    citedPayer: null,
    citedTx: null,
    advanced: false,
    advancedAmount: 0n,
  };
}

export function underwrite(invoice: Invoice, facts: AttestedFact[]): Decision {
  if (invoice.advanced) {
    return { action: "REFUSE", reason: "already advanced", advanceBps: 0, paid: 0n };
  }
  const fact = facts.find((f) => f.invoiceId === invoice.id);
  if (!fact) {
    return { action: "HOLD", reason: "file has no attested facts", advanceBps: 0, paid: 0n };
  }
  if (fact.receiptStatus !== 1) {
    return { action: "REFUSE", reason: "source transaction failed", advanceBps: 0, paid: 0n };
  }
  if (fact.source.toLowerCase() !== invoice.source.toLowerCase()) {
    return { action: "REFUSE", reason: "InvoicePaid not emitted by the registered pay desk", advanceBps: 0, paid: 0n };
  }
  if (fact.token.toLowerCase() !== invoice.token.toLowerCase()) {
    return { action: "REFUSE", reason: "cited token is not the invoice token", advanceBps: 0, paid: 0n };
  }
  if (fact.amount < invoice.face) {
    return { action: "REFUSE", reason: "cited amount is below face", advanceBps: 0, paid: 0n };
  }
  return {
    action: "ADVANCE",
    reason: "attested payment covers face; 10% holdback",
    advanceBps: ADVANCE_BPS,
    paid: advanceAmount(invoice.face),
  };
}

export function applyCite(invoice: Invoice, fact: AttestedFact): Invoice {
  if (invoice.advanced) throw new Error("already advanced");
  if (fact.receiptStatus !== 1) throw new Error("source tx failed");
  if (fact.source.toLowerCase() !== invoice.source.toLowerCase()) throw new Error("wrong emitter");
  if (fact.token.toLowerCase() !== invoice.token.toLowerCase()) throw new Error("wrong token");
  if (fact.invoiceId !== invoice.id) throw new Error("unknown invoice");
  return {
    ...invoice,
    citedAmount: invoice.citedAmount + fact.amount,
    citedPayer: fact.payer,
    citedTx: fact.txHash,
  };
}

export function applyAdvance(invoice: Invoice, facts: AttestedFact[]): Invoice {
  const decision = underwrite(invoice, facts);
  if (decision.action !== "ADVANCE") throw new Error(decision.reason);
  return { ...invoice, advanced: true, advancedAmount: decision.paid };
}
