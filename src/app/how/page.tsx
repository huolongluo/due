export default function HowPage() {
  return (
    <main className="wrap" style={{ paddingBottom: "3rem" }}>
      <p className="kicker">Attestcoin Protocol</p>
      <h1>Citation is the product.</h1>
      <p className="lede">
        Creditcoin’s native verifier does not tell DueVault that an invoice was paid. It proves a
        transaction was in a Sepolia block that Creditcoin has attested. DueVault then decodes that
        transaction and decides whether the log is the one it registered.
      </p>
      <section className="grid" style={{ marginTop: "1.4rem" }}>
        <article className="card">
          <h3>1. Source chain</h3>
          <p className="muted">
            Kestrel calls <span className="mono">InvoicePay.pay(4417, 12_000e6)</span> on Sepolia. That is the only
            contract whose <span className="mono">InvoicePaid</span> logs the vault will accept.
          </p>
        </article>
        <article className="card">
          <h3>2. Proof</h3>
          <p className="muted">
            The worker waits until CC3 attests that height, then asks the Proof Builder for a merkle
            inclusion proof and a continuity proof. No operator signs the amount.
          </p>
        </article>
        <article className="card">
          <h3>3. verifyAndEmit</h3>
          <p className="muted">
            <span className="mono">DueVault.cite</span> calls <span className="mono">0x0000…0FD2</span>. If the
            proof fails, the whole call reverts. Reed never sees a half-written file.
          </p>
        </article>
        <article className="card">
          <h3>4. Decode the same bytes</h3>
          <p className="muted">
            Official <span className="mono">EvmV1Decoder</span> at{" "}
            <span className="mono">0x731c…F9f</span> checks receipt status, pulls{" "}
            <span className="mono">InvoicePaid</span>, and requires the emitter, token, and invoice id
            to match.
          </p>
        </article>
        <article className="card">
          <h3>5. Reed</h3>
          <p className="muted">
            The AI underwriter is shown attested facts and ignored claims. It can say HOLD, REFUSE, or
            ADVANCE. It cannot mint. <span className="mono">advance()</span> re-runs the same policy
            on chain.
          </p>
        </article>
        <article className="card">
          <h3>6. Replay</h3>
          <p className="muted">
            <span className="mono">usedTx[keccak(encodedTransaction)]</span> makes the same payment
            unusable a second time. That is the second control shot.
          </p>
        </article>
      </section>
    </main>
  );
}
