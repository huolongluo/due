# Due — whitepaper

## Problem

Suppliers get paid late. Factoring desks today either trust a PDF, a bank SWIFT, or a centralized oracle. Creditcoin’s thesis is verifiable credit. Attestcoin’s thesis is verified foreign-chain data without a single operator. Neither is served by wrapping Hello Bridge.

## Product

Due is a Creditcoin factoring vault whose credit file is empty until Attestcoin cites an Ethereum `InvoicePaid`.

An AI officer (Reed) underwrites the file. It is allowed to recommend. It is not allowed to mint. The vault re-runs the same policy.

## Why Creditcoin

Ethereum already has the payer. Creditcoin needs the user. Importing a proven payment — not a scraped balance — is how a real-world invoice becomes a Creditcoin advance.

## Mechanics

1. File invoice `(supplier, token, face)` on `DueVault`.
2. Buyer pays `InvoicePay` on Sepolia.
3. Worker builds merkle + continuity proofs after attestation.
4. `cite()` → `verifyAndEmit` → decode → bind `citedAmount`.
5. Reed reads attested facts, ignores claims.
6. `advance()` mints 90% DUE to the supplier.

Failure modes that must revert: bad proof, failed receipt, wrong emitter, wrong token, short amount, replay.

## Market

Invoice finance is a large real-world market. The first users are importers already paying on Ethereum and suppliers willing to receive on Creditcoin. That is user-base expansion, not a new token.

## CEIP

Due is a desk that can sit in front of any Creditcoin credit product. The citation layer is reusable: payroll, remittances, and trade documents are the same `cite()` with a different event signature.
