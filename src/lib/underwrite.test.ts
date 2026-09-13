import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reed } from "./underwrite";
import { FACE, PAYER, SOURCE_PAY, TOKEN, openInvoice } from "./policy";

describe("reed", () => {
  it("ignores unattested claims when scoring", () => {
    const invoice = openInvoice();
    const opinion = reed(invoice, [], [
      { label: "etherscan", txHash: "0xdead", attested: false },
    ]);
    assert.equal(opinion.action, "HOLD");
    assert.deepEqual(opinion.saw, []);
    assert.equal(opinion.ignored.length, 1);
    assert.match(opinion.narrative, /no Attestcoin/);
  });

  it("names the citation once Attestcoin has filled the file", () => {
    const invoice = { ...openInvoice(), citedAmount: FACE, citedPayer: PAYER };
    const opinion = reed(
      invoice,
      [
        {
          invoiceId: 4417,
          payer: PAYER,
          token: TOKEN,
          amount: FACE,
          source: SOURCE_PAY,
          txHash: "0x4417aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa4417",
          receiptStatus: 1,
        },
      ],
      [{ label: "etherscan", txHash: "0xdead", attested: false }],
    );
    assert.equal(opinion.action, "ADVANCE");
    assert.equal(opinion.saw.length, 1);
    assert.match(opinion.narrative, /10,800/);
  });
});
