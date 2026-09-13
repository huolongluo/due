import Link from "next/link";

export default function HomePage() {
  return (
    <main className="wrap" style={{ padding: "2.4rem 0 4rem" }}>
      <p className="kicker">Quay Factors · Creditcoin CC3</p>
      <h1>The model can underwrite. It cannot advance until Attestcoin cites the payment.</h1>
      <p className="lede">
        Invoice 4417 is 12,000 qUSD of LED drivers, Lin Wei to Kestrel. Reed, the AI officer, may
        read the file. It may not mint an advance until the Attestcoin Protocol proves Kestrel paid
        on Ethereum — inclusion, continuity, emitter, token, amount — inside one Creditcoin
        transaction.
      </p>
      <div className="row">
        <Link className="btn gold" href="/desk?play=1">
          Run the desk
        </Link>
        <Link className="btn ghost" href="/how">
          How citation works
        </Link>
      </div>
      <section className="grid three">
        <article className="card">
          <h3>Claim</h3>
          <p className="muted">Kestrel can paste an Etherscan URL. Reed files it as a claim. The vault stays closed.</p>
        </article>
        <article className="card">
          <h3>Cite</h3>
          <p className="muted">
            Merkle + continuity proofs hit precompile <span className="mono">0x0FD2</span>. The official decoder
            extracts <span className="mono">InvoicePaid</span> from the same bytes.
          </p>
        </article>
        <article className="card">
          <h3>Advance</h3>
          <p className="muted">Only then Reed recommends 90%. DueVault re-checks the file and mints DUE to Lin. Replay is refused.</p>
        </article>
      </section>
    </main>
  );
}
