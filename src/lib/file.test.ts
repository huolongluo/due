import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceFile, citeFake, citeGood, newFile, replay } from "./file";

describe("file", () => {
  it("starts filed and holding — Reed will not advance on a claim", () => {
    const f = newFile();
    assert.equal(f.phase, "filed");
    assert.equal(f.opinion?.action, "HOLD");
    assert.equal(f.invoice.citedAmount, 0n);
  });

  it("refuses a fake Etherscan cite", () => {
    const f = citeFake(newFile());
    assert.equal(f.phase, "refused");
    assert.equal(f.invoice.citedAmount, 0n);
  });

  it("cites, advances, then refuses a replay", () => {
    const cited = citeGood(newFile());
    assert.equal(cited.phase, "cited");
    assert.equal(cited.invoice.citedAmount, 12_000_000_000n);
    assert.equal(cited.opinion?.action, "ADVANCE");
    const paid = advanceFile(cited);
    assert.equal(paid.phase, "advanced");
    assert.equal(paid.invoice.advancedAmount, 10_800_000_000n);
    assert.equal(paid.opinion?.action, "ADVANCE");
    assert.match(paid.opinion?.narrative || "", /Already advanced/);
    const again = replay(paid);
    assert.ok(again.beats.some((b) => /Replay/.test(b.title)));
  });
});
