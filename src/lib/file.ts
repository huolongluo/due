import {
  FACE,
  INVOICE_ID,
  PAYER,
  SOURCE_PAY,
  TOKEN,
  applyAdvance,
  applyCite,
  openInvoice,
  type AttestedFact,
  type Invoice,
} from "./policy";
import { reed, type Claim, type Opinion } from "./underwrite";

export type Phase = "idle" | "filed" | "holding" | "refused" | "cited" | "advanced";

export type Beat = { id: string; kind: string; title: string; detail: string };

export type FileState = {
  id: string;
  phase: Phase;
  invoice: Invoice;
  facts: AttestedFact[];
  claims: Claim[];
  opinion: Opinion | null;
  usedProofs: string[];
  beats: Beat[];
  live: boolean;
};

const FAKE_CLAIM: Claim = {
  label: "Etherscan screenshot · 0xdead…pay",
  txHash: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  attested: false,
};

export const GOOD_FACT: AttestedFact = {
  invoiceId: INVOICE_ID,
  payer: PAYER,
  token: TOKEN,
  amount: FACE,
  source: SOURCE_PAY,
  txHash: "0x4417aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4417",
  receiptStatus: 1,
};

export const WRONG_EMITTER: AttestedFact = {
  ...GOOD_FACT,
  txHash: "0xbad1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbad1",
  source: "0x9999999999999999999999999999999999994417",
};

function beat(kind: string, title: string, detail: string): Beat {
  return { id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, kind, title, detail };
}

export function newFile(live = false): FileState {
  const invoice = openInvoice();
  return {
    id: `due-${INVOICE_ID}`,
    phase: "filed",
    invoice,
    facts: [],
    claims: [FAKE_CLAIM],
    opinion: reed(invoice, [], [FAKE_CLAIM]),
    usedProofs: [],
    beats: [beat("file", "Invoice 4417 filed", "Lin Wei → Kestrel · 12,000 qUSD LED drivers · NET-30")],
    live,
  };
}

export function score(state: FileState): FileState {
  const opinion = reed(state.invoice, state.facts, state.claims);
  const phase: Phase =
    opinion.action === "HOLD" ? "holding" : opinion.action === "REFUSE" ? "refused" : "cited";
  return {
    ...state,
    opinion,
    phase: state.invoice.advanced ? "advanced" : phase,
    beats: [...state.beats, beat("reed", `Reed: ${opinion.action}`, opinion.narrative)],
  };
}

export function citeFake(state: FileState): FileState {
  return {
    ...state,
    phase: "refused",
    beats: [
      ...state.beats,
      beat("cite", "Cite refused", "A screenshot is not an Attestcoin proof. Precompile never ran."),
    ],
    opinion: {
      ...reed(state.invoice, state.facts, state.claims),
      action: "REFUSE",
      reason: "no merkle/continuity proof",
      narrative: "I will not treat an Etherscan URL as a citation.",
      saw: [],
      ignored: [FAKE_CLAIM.label],
      officer: "Reed",
      advanceBps: 0,
      paid: 0n,
    },
  };
}

export function citeGood(state: FileState): FileState {
  if (state.usedProofs.includes(GOOD_FACT.txHash)) {
    return {
      ...state,
      phase: "refused",
      beats: [...state.beats, beat("cite", "Replay refused", "usedTx[txKey] is already true.")],
    };
  }
  const invoice = applyCite(state.invoice, GOOD_FACT);
  const facts = [...state.facts, GOOD_FACT];
  const next: FileState = {
    ...state,
    invoice,
    facts,
    usedProofs: [...state.usedProofs, GOOD_FACT.txHash],
    claims: state.claims.map((c) => (c.txHash === FAKE_CLAIM.txHash ? c : c)).concat([
      { label: `Attestcoin · ${GOOD_FACT.txHash.slice(0, 10)}…`, txHash: GOOD_FACT.txHash, attested: true },
    ]),
    beats: [
      ...state.beats,
      beat(
        "cite",
        "Cited on Creditcoin",
        "verifyAndEmit @ 0x0FD2 · decoder extracted InvoicePaid from the same bytes",
      ),
    ],
  };
  return score(next);
}

export function citeWrongEmitter(state: FileState): FileState {
  return {
    ...state,
    phase: "refused",
    beats: [
      ...state.beats,
      beat("cite", "Wrong emitter", "Proof verified. Log was not from the registered InvoicePay."),
    ],
  };
}

export function advanceFile(state: FileState): FileState {
  const invoice = applyAdvance(state.invoice, state.facts);
  return {
    ...state,
    invoice,
    phase: "advanced",
    beats: [
      ...state.beats,
      beat("advance", "Advanced 10,800 qUSD", "Vault minted DUE to Lin Wei. 1,200 qUSD holdback."),
    ],
    opinion: reed(invoice, state.facts, state.claims),
  };
}

export function replay(state: FileState): FileState {
  if (!state.usedProofs.includes(GOOD_FACT.txHash)) {
    return citeGood(state);
  }
  return {
    ...state,
    phase: state.invoice.advanced ? "advanced" : "refused",
    beats: [...state.beats, beat("cite", "Replay refused", "The same encoded transaction cannot pay twice.")],
  };
}
