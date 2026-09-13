import { json } from "@/lib/json";
import { citeOnCreditcoin } from "@/lib/attest";
import {
  FileState,
  advanceFile,
  citeFake,
  citeGood,
  newFile,
  replay,
  score,
} from "@/lib/file";

export const dynamic = "force-dynamic";

const files = new Map<string, FileState>();

export async function POST(req: Request) {
  const body = (await req.json()) as { action?: string; id?: string };
  const action = body.action || "start";

  if (action === "start") {
    const file = score(newFile());
    files.set(file.id, file);
    return json(file);
  }

  const current = body.id ? files.get(body.id) : undefined;
  if (!current) return json({ error: "unknown file" }, 404);

  try {
    let next = current;
    if (action === "fake") next = citeFake(current);
    else if (action === "cite") {
      const result = await citeOnCreditcoin(current.claims[0]?.txHash || "");
      if (!result.ok) return json({ error: result.error }, 400);
      next = citeGood(current);
      if (result.mode === "live" && result.txHash) {
        next = {
          ...next,
          live: true,
          beats: next.beats.map((b, i) =>
            i === next.beats.length - 1 ? { ...b, detail: `${b.detail} · ${result.txHash}` } : b,
          ),
        };
      }
    } else if (action === "advance") next = advanceFile(current);
    else if (action === "replay") next = replay(current);
    else return json({ error: "unknown action" }, 400);

    files.set(next.id, next);
    return json(next);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 400);
  }
}
