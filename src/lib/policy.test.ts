import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FACE,
  PAYER,
  SOURCE_PAY,
  TOKEN,
  advanceAmount,
  applyAdvance,
  applyCite,
  openInvoice,
  underwrite,
  type AttestedFact,
} from "./policy";

const good: AttestedFact = {
  invoiceId: 4417,
  payer: PAYER,
  token: TOKEN,
  amount: FACE,
  source: SOURCE_PAY,
  txHash: "0x01",
  receiptStatus: 1,
};

describe("policy", () => {
  it("holds when the file has no attested facts", () => {
    const d = underwrite(openInvoice(), []);
    assert.equal(d.action, "HOLD");
  });

  it("refuses a failed source receipt even if the amount looks right", () => {
    const d = underwrite(openInvoice(), [{ ...good, receiptStatus: 0 }]);
    assert.equal(d.action, "REFUSE");
    assert.match(d.reason, /failed/);
  });

  it("refuses a log from the wrong source contract", () => {
    const d = underwrite(openInvoice(), [{ ...good, source: PAYER }]);
    assert.equal(d.action, "REFUSE");
    assert.match(d.reason, /pay desk/);
  });

  it("refuses the wrong token", () => {
    const d = underwrite(openInvoice(), [{ ...good, token: PAYER }]);
    assert.equal(d.action, "REFUSE");
  });

  it("refuses a short payment", () => {
    const d = underwrite(openInvoice(), [{ ...good, amount: FACE - 1n }]);
    assert.equal(d.action, "REFUSE");
    assert.match(d.reason, /below face/);
  });

  it("advances 90% only after a matching cite", () => {
    const inv = applyCite(openInvoice(), good);
    const d = underwrite(inv, [good]);
    assert.equal(d.action, "ADVANCE");
    assert.equal(d.paid, 10_800_000_000n);
    assert.equal(advanceAmount(FACE), 10_800_000_000n);
    const done = applyAdvance(inv, [good]);
    assert.equal(done.advanced, true);
    assert.throws(() => applyAdvance(done, [good]));
  });
});
