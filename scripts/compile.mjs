import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const solc = require("solc");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function compile(file, names) {
  const source = readFileSync(join(root, "contracts", file), "utf8");
  const input = {
    language: "Solidity",
    sources: { [file]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length) {
    console.error(errors);
    process.exit(1);
  }
  const dir = join(root, "contracts/out");
  mkdirSync(dir, { recursive: true });
  for (const name of names) {
    const artifact = output.contracts[file][name];
    if (!artifact?.evm?.bytecode?.object) {
      console.error(`no bytecode for ${name}`);
      process.exit(1);
    }
    writeFileSync(
      join(dir, `${name}.json`),
      JSON.stringify(
        {
          contractName: name,
          abi: artifact.abi,
          bytecode: `0x${artifact.evm.bytecode.object}`,
        },
        null,
        2,
      ),
    );
    console.log("wrote", name, artifact.evm.bytecode.object.length / 2, "bytes");
  }
}

compile("InvoicePay.sol", ["QuayUSD", "InvoicePay"]);
compile("DueVault.sol", ["DueVault"]);
