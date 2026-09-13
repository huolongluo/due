// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

/// @notice Attestcoin native query verifier precompile on Creditcoin (0x0FD2).
interface INativeQueryVerifier {
    struct MerkleProofEntry {
        bytes32 hash;
        bool isLeft;
    }

    struct MerkleProof {
        bytes32 root;
        MerkleProofEntry[] siblings;
    }

    struct ContinuityProof {
        bytes32 lowerEndpointDigest;
        bytes32[] roots;
    }

    function verifyAndEmit(
        uint64 chainKey,
        uint64 height,
        bytes calldata encodedTransaction,
        MerkleProof calldata merkleProof,
        ContinuityProof calldata continuityProof
    ) external returns (bool);
}

/// @notice Official EvmV1Decoder deployed on CC3 testnet at 0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f
interface IEvmV1Decoder {
    struct LogEntry {
        address address_;
        bytes32[] topics;
        bytes data;
    }

    struct ReceiptFields {
        uint8 receiptStatus;
        uint64 receiptGasUsed;
        LogEntry[] receiptLogs;
        bytes receiptLogsBloom;
    }

    function getTransactionType(bytes calldata encodedTx) external pure returns (uint8);
    function isValidTransactionType(uint8 txType) external pure returns (bool);
    function decodeReceiptFields(bytes calldata chunk) external pure returns (ReceiptFields memory);
    function getLogsByEventSignature(ReceiptFields memory receipt, bytes32 eventSignature)
        external
        pure
        returns (LogEntry[] memory);
}

/// @title DueVault — Creditcoin Attestcoin Smart Contract for invoice factoring
/// @notice The AI underwriter may recommend. This contract will not advance until
///         Attestcoin verifies a source-chain InvoicePaid and the decoder extracts
///         a matching log from the same bytes the precompile just proved.
contract DueVault {
    uint16 public constant ADVANCE_BPS = 9000;
    uint64 public constant SEPOLIA_CHAIN_KEY = 1;
    bytes32 public constant INVOICE_PAID_SIG =
        keccak256("InvoicePaid(uint256,address,address,uint256)");

    INativeQueryVerifier public immutable prover;
    IEvmV1Decoder public immutable decoder;
    address public immutable sourcePay;
    address public owner;

    string public constant name = "Due Advance";
    string public constant symbol = "DUE";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    struct Invoice {
        address supplier;
        address token;
        uint256 face;
        uint256 citedAmount;
        address citedPayer;
        bool filed;
        bool advanced;
    }

    mapping(uint256 => Invoice) public invoices;
    mapping(bytes32 => bool) public usedTx;

    event Filed(uint256 indexed invoiceId, address indexed supplier, address token, uint256 face);
    event Cited(uint256 indexed invoiceId, address indexed payer, uint256 amount, bytes32 txKey);
    event Advanced(uint256 indexed invoiceId, address indexed supplier, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 value);

    error NotOwner();
    error UnknownInvoice();
    error AlreadyAdvanced();
    error Replay();
    error ProofRejected();
    error SourceTxFailed();
    error WrongEmitter();
    error WrongToken();
    error ShortCite();
    error NotCited();
    error WrongChain();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address prover_, address decoder_, address sourcePay_) {
        prover = INativeQueryVerifier(prover_);
        decoder = IEvmV1Decoder(decoder_);
        sourcePay = sourcePay_;
        owner = msg.sender;
    }

    function file(uint256 invoiceId, address supplier, address token, uint256 face) external onlyOwner {
        require(supplier != address(0) && token != address(0) && face > 0, "file args");
        Invoice storage inv = invoices[invoiceId];
        require(!inv.filed, "exists");
        invoices[invoiceId] = Invoice({
            supplier: supplier,
            token: token,
            face: face,
            citedAmount: 0,
            citedPayer: address(0),
            filed: true,
            advanced: false
        });
        emit Filed(invoiceId, supplier, token, face);
    }

    /// @notice Prove a Sepolia InvoicePaid with Attestcoin, then bind it to an invoice.
    ///         Depth: precompile inclusion+continuity, receipt status, emitter, token, replay.
    function cite(
        uint64 chainKey,
        uint64 height,
        bytes calldata encodedTransaction,
        INativeQueryVerifier.MerkleProof calldata merkleProof,
        INativeQueryVerifier.ContinuityProof calldata continuityProof
    ) external returns (uint256 invoiceId, uint256 amount) {
        if (chainKey != SEPOLIA_CHAIN_KEY) revert WrongChain();
        bytes32 txKey = keccak256(encodedTransaction);
        if (usedTx[txKey]) revert Replay();

        bool ok = prover.verifyAndEmit(chainKey, height, encodedTransaction, merkleProof, continuityProof);
        if (!ok) revert ProofRejected();

        uint8 txType = decoder.getTransactionType(encodedTransaction);
        require(decoder.isValidTransactionType(txType), "bad tx type");

        IEvmV1Decoder.ReceiptFields memory receipt = decoder.decodeReceiptFields(encodedTransaction);
        if (receipt.receiptStatus != 1) revert SourceTxFailed();

        IEvmV1Decoder.LogEntry[] memory logs = decoder.getLogsByEventSignature(receipt, INVOICE_PAID_SIG);
        require(logs.length > 0, "no InvoicePaid");
        IEvmV1Decoder.LogEntry memory log = logs[0];
        if (log.address_ != sourcePay) revert WrongEmitter();
        require(log.topics.length == 4, "topics");

        invoiceId = uint256(log.topics[1]);
        address payer = address(uint160(uint256(log.topics[2])));
        address token = address(uint160(uint256(log.topics[3])));
        amount = abi.decode(log.data, (uint256));

        Invoice storage inv = invoices[invoiceId];
        if (!inv.filed) revert UnknownInvoice();
        if (inv.advanced) revert AlreadyAdvanced();
        if (token != inv.token) revert WrongToken();

        usedTx[txKey] = true;
        inv.citedAmount += amount;
        inv.citedPayer = payer;
        emit Cited(invoiceId, payer, amount, txKey);
    }

    /// @notice Mint a 90% advance. The AI cannot skip cite(); the vault re-checks the file.
    function advance(uint256 invoiceId) external returns (uint256 paid) {
        Invoice storage inv = invoices[invoiceId];
        if (!inv.filed) revert UnknownInvoice();
        if (inv.advanced) revert AlreadyAdvanced();
        if (inv.citedAmount == 0) revert NotCited();
        if (inv.citedAmount < inv.face) revert ShortCite();

        inv.advanced = true;
        paid = (inv.face * ADVANCE_BPS) / 10_000;
        totalSupply += paid;
        balanceOf[inv.supplier] += paid;
        emit Transfer(address(0), inv.supplier, paid);
        emit Advanced(invoiceId, inv.supplier, paid);
    }
}
