import { Suspense } from "react";
import { Desk } from "@/components/Desk";

export default function DeskPage() {
  return (
    <main className="wrap">
      <p className="kicker">Quay desk</p>
      <h1>Invoice 4417</h1>
      <p className="lede">
        Reed underwrites from attested facts only. A screenshot cannot open the vault. A replay
        cannot pay twice.
      </p>
      <Suspense fallback={<p className="muted">Loading desk…</p>}>
        <Desk />
      </Suspense>
    </main>
  );
}
