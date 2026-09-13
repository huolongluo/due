# Due

**The model can underwrite. It cannot advance until Attestcoin cites the payment.**

[BUIDL CTC 2026 Fall](https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail) · **AI + RWA** · Attestcoin Protocol

Lin Wei is owed 12,000 qUSD for LED drivers. Kestrel paid on Ethereum. Reed, an AI credit officer on Creditcoin, may read the file. It cannot mint an advance until the Attestcoin Protocol proves that `InvoicePaid` — inclusion, continuity, emitter, token, amount — inside one Creditcoin transaction.

This project lives in `due/` only. It does not touch other hackathon folders. Port **3077**.

## Why this can win

Judges score Attestcoin depth, user-base expansion, technical alignment, product vision, and market fit. AI is a new track this season.

| Pillar | What we built |
| --- | --- |
| Attestcoin depth | `DueVault.cite` calls native precompile `0x0FD2`, then the official `EvmV1Decoder` extracts `InvoicePaid` from the **same** bytes. Wrong emitter, failed receipt, wrong token, and replay all revert. |
| AI track | Reed underwrites from attested facts only. A pasted Etherscan URL is a claim. It never becomes a score. The vault re-checks policy on `advance()`. |
| Real world | Invoice factoring is how suppliers get paid. Ethereum payers, Creditcoin settlement — that is user-base expansion. |
| Not a tutorial clone | Not Hello Bridge. Not Aave-score-then-lend. The product is the **citation**, then a 90% advance. |

The wow is the **HOLD** stamp on a screenshot, then **CITED**, then **DUE**, then a replay that pays nothing.

## Architecture

![Architecture](docs/architecture.svg)

```text
Kestrel  --pay-->  InvoicePay (Sepolia)
                       │ InvoicePaid(4417, payer, qUSD, 12000e6)
                       ▼
              Proof Builder + Attestcoin
                       │ merkle + continuity
                       ▼
Reed (AI)  --recommend-->  DueVault.cite @ 0x0FD2
                              │ decode InvoicePaid
                              ▼
                         advance 90% DUE → Lin Wei
```

The LLM never calls `cite()`. The vault never trusts Reed.

## Quick start

Node 22+. No keys required for the judging replay.

```bash
cd due
npm install
npm test
npm run chain:compile
npm run dev
```

Open [http://127.0.0.1:3077/desk?play=1](http://127.0.0.1:3077/desk?play=1)

1. File 4417 opens. Reed **HOLD**s — no attested facts.
2. Cite a screenshot. **NO**.
3. Cite with Attestcoin. **CITED**.
4. Advance 90%. Stamp **DUE**.
5. Replay the proof. Still **DUE**, second payment refused.

### Live Creditcoin

```bash
export CREDITCOIN_PRIVATE_KEY=0x...
export SEPOLIA_PRIVATE_KEY=0x...
npm run chain:deploy
```

Fund the CC3 address from Discord `#token-faucet` (`/faucet address:0x…`) and the Sepolia address from a Sepolia faucet. Then the desk’s **Cite with Attestcoin** path waits for attestation and submits `cite()` on chain.

## Tests

```bash
npm test
```

Covers: hold with no facts, failed receipt, wrong emitter, wrong token, short payment, 90% advance, screenshot refused, replay refused. Reed ignores unattested claims.

## Attestcoin

See [`docs/ATTESTCOIN.md`](docs/ATTESTCOIN.md). Precompile `0x0000000000000000000000000000000000000FD2`. Decoder `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f`. Sepolia `chainKey = 1`.

## Submit

See `SUBMIT.md`. Video script: `VIDEO_SCRIPT.md`. DoraHacks paste: `DORAHACKS.md`. AI attribution: `AI.md`.

## License

Apache-2.0.
