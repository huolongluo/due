# Attestcoin Protocol integration

Due uses Attestcoin as the credit file, not as a badge.

## What is proven

A Sepolia `InvoicePay.pay` transaction. Creditcoin does not take Reed’s word, a REST oracle, or an Etherscan URL. It verifies:

1. Merkle inclusion of the encoded transaction in a Sepolia block.
2. Continuity of that block to an attestation Creditcoin already stored.
3. Receipt status `1`.
4. A log `InvoicePaid(invoiceId, payer, token, amount)` emitted by the **registered** `InvoicePay`.
5. That token equals the invoice token.
6. That `keccak256(encodedTransaction)` has never been used.

Steps 1–2 are the native precompile. Steps 3–6 are DueVault. Removing either side lets a fake payment through; tests fail if the policy side is skipped.

## Addresses (CC3 testnet)

| Piece | Address |
| --- | --- |
| Block prover precompile | `0x0000000000000000000000000000000000000FD2` |
| ChainInfo precompile | `0x0000000000000000000000000000000000000fd3` |
| EvmV1Decoder | `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f` |
| Sepolia chainKey | `1` |
| Proof builder | `https://proof-gen-api.cc3-testnet.creditcoin.network` |
| SDK | `@gluwa/usc-sdk` |

Deployed DueVault / InvoicePay addresses are written to `contracts/out/deployment.json` after `npm run chain:deploy`.

## Call path

```solidity
bool ok = prover.verifyAndEmit(chainKey, height, encodedTransaction, merkleProof, continuityProof);
if (!ok) revert ProofRejected();
ReceiptFields memory receipt = decoder.decodeReceiptFields(encodedTransaction);
LogEntry[] memory logs = decoder.getLogsByEventSignature(receipt, INVOICE_PAID_SIG);
```

`cite()` is the only door into the file. `advance()` does not take a proof. It reads `citedAmount` that `cite()` already bound.

## Why this is deeper than a token bridge

Hello Bridge mints because tokens were burned. Due refuses to mint unless the **business event** matches a registered invoice. A contract that emits a homemade `InvoicePaid` can still get a valid Attestcoin proof; the vault still reverts on `WrongEmitter`.

## Worker

`src/lib/attest.ts` uses `ProofBuilder.waitUntilHeightAttested` then `getProof`. Replay mode skips the network so judges can watch the desk without keys. Live mode submits `cite()` with the SDK packet.

## What Reed is allowed to see

Attested facts only. Unattested claims are listed under `ignored`. That is the AI track: the model processes cryptographically verified cross-chain data and then recommends `advance()`. It cannot push the button without the vault.
