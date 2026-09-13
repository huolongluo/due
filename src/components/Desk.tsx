"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Beat = { id: string; kind: string; title: string; detail: string };
type Opinion = {
  action: string;
  reason: string;
  narrative: string;
  saw: string[];
  ignored: string[];
  paid: string;
};
type FileState = {
  id: string;
  phase: "idle" | "filed" | "holding" | "refused" | "cited" | "advanced";
  invoice: { face: string; citedAmount: string; advanced: boolean; advancedAmount: string };
  opinion: Opinion | null;
  beats: Beat[];
  live: boolean;
};
type Health = {
  replay: boolean;
  live: boolean;
  vault: string | null;
  invoicePay: string | null;
  prover: string;
  decoder: string;
};

function stampClass(phase: FileState["phase"]) {
  if (phase === "holding" || phase === "filed") return "stamp hold";
  if (phase === "cited") return "stamp cited";
  if (phase === "advanced") return "stamp granted";
  if (phase === "refused") return "stamp denied";
  return "stamp";
}

function stampLabel(phase: FileState["phase"]) {
  if (phase === "holding" || phase === "filed") return "HOLD";
  if (phase === "cited") return "CITED";
  if (phase === "advanced") return "DUE";
  if (phase === "refused") return "NO";
  return "FILE";
}

function qusd(raw: string | undefined) {
  const n = Number(raw || "0") / 1_000_000;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function Desk() {
  const params = useSearchParams();
  const autoplay = params.get("play") === "1";
  const [health, setHealth] = useState<Health | null>(null);
  const [file, setFile] = useState<FileState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  async function call(action: string, id?: string): Promise<FileState> {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "run failed");
    return body as FileState;
  }

  async function act(action: string) {
    setBusy(true);
    setError(null);
    try {
      const next = await call(action, file?.id);
      setFile(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoplay) return;
    let alive = true;
    (async () => {
      try {
        setBusy(true);
        const first = await call("start");
        if (!alive) return;
        setFile(first);
        await new Promise((r) => setTimeout(r, 1100));
        if (!alive) return;
        const fake = await call("fake", first.id);
        if (!alive) return;
        setFile(fake);
        await new Promise((r) => setTimeout(r, 1100));
        if (!alive) return;
        const cited = await call("cite", first.id);
        if (!alive) return;
        setFile(cited);
        await new Promise((r) => setTimeout(r, 1100));
        if (!alive) return;
        const paid = await call("advance", first.id);
        if (!alive) return;
        setFile(paid);
        await new Promise((r) => setTimeout(r, 1100));
        if (!alive) return;
        setFile(await call("replay", first.id));
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [autoplay]);

  const phase = file?.phase || "idle";

  return (
    <section className="desk-grid">
      <div className="docket">
        <div className={stampClass(phase)}>{stampLabel(phase)}</div>
        <p className="kicker">File 4417 · Lin Wei × Kestrel</p>
        <h2>12,000 qUSD LED drivers</h2>
        <p className="muted">
          Face {qusd(file?.invoice.face || "12000000000")} · cited{" "}
          {qusd(file?.invoice.citedAmount)} · advanced {qusd(file?.invoice.advancedAmount)}
        </p>
        {file?.opinion ? (
          <div style={{ marginTop: "1.1rem" }}>
            <p className="mono">Reed · {file.opinion.action}</p>
            <p>{file.opinion.narrative}</p>
            {file.opinion.ignored.length > 0 ? (
              <p className="muted">Ignored: {file.opinion.ignored.join("; ")}</p>
            ) : null}
            {file.opinion.saw.length > 0 ? (
              <p className="mono">{file.opinion.saw.join(" · ")}</p>
            ) : null}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: "1.2rem" }}>
            Open the file to let Reed look. It will not mint.
          </p>
        )}
        <div className="row">
          <button className="btn gold" disabled={busy} onClick={() => act("start")}>
            Open file
          </button>
          <button className="btn danger" disabled={busy || !file} onClick={() => act("fake")}>
            Cite screenshot
          </button>
          <button className="btn sea" disabled={busy || !file} onClick={() => act("cite")}>
            Cite with Attestcoin
          </button>
          <button className="btn ghost" disabled={busy || file?.phase !== "cited"} onClick={() => act("advance")}>
            Advance 90%
          </button>
          <button className="btn ghost" disabled={busy || !file} onClick={() => act("replay")}>
            Replay proof
          </button>
        </div>
        {error ? <p className="err">{error}</p> : null}
        <div className="health">
          <span className="pill">{health?.replay ? "replay" : "live keys"}</span>
          <span className="pill">prover {health?.prover?.slice(0, 10) || "0x0FD2"}…</span>
          {health?.vault ? <span className="pill">vault {health.vault.slice(0, 10)}…</span> : <span className="pill">vault undeployed</span>}
        </div>
      </div>
      <aside className="card">
        <h3>Tape</h3>
        <ol className="beats">
          {(file?.beats || []).map((b) => (
            <li key={b.id}>
              <strong>{b.title}</strong>
              <span className="muted">{b.detail}</span>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
